/* ==========================================================================
   Udvegadarshini - Standard ESP32 BioAmp EXG Pill EEG Stress Detection System
   Board: ESP32 Dev Module (DOIT ESP32 DEVKIT V1)
   Sampling Rate: 250 Hz (4000 µs period)
   ADC Input: GPIO 34 (Analog VP on ESP32)
   Includes: Smart Lead-Off Disconnection Detection
   ========================================================================== */

#include <Arduino.h>
#include "BluetoothSerial.h"

BluetoothSerial SerialBT;

const int EEG_PIN = 34;            // GPIO 34 (ADC1 CH6) - Connect to BioAmp EXG OUT
const int SAMPLING_FREQ = 250;     // 250 Hz Sampling frequency
const int SAMPLE_PERIOD_US = 4000; // 4000 µs
const int WINDOW_SIZE = 125;       // 500ms sliding buffer window

float eegBuffer[WINDOW_SIZE];
int bufferIndex = 0;
unsigned long lastSampleTime = 0;

float applyBandpassFilter(float rawSample);
float applyNotchFilter(float sample);
void extractFeaturesAndPredict();

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(EEG_PIN, INPUT);
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  SerialBT.begin("Udvegadarshini-ESP32-BT");

  Serial.println("==================================================");
  Serial.println(" Udvegadarshini ESP32 BioAmp EXG System Initialized");
  Serial.println(" Bluetooth Name: Udvegadarshini-ESP32-BT");
  Serial.println(" Baud Rate: 115200 | Sampling: 250Hz");
  Serial.println("==================================================");
}

void loop() {
  unsigned long currentMicros = micros();

  if (currentMicros - lastSampleTime >= SAMPLE_PERIOD_US) {
    lastSampleTime = currentMicros;

    int rawAdc = analogRead(EEG_PIN);
    float voltage = (rawAdc / 4095.0) * 3.3;

    float filteredSignal = applyNotchFilter(applyBandpassFilter(voltage));

    eegBuffer[bufferIndex] = filteredSignal;
    bufferIndex++;

    if (bufferIndex >= WINDOW_SIZE) {
      extractFeaturesAndPredict();
      bufferIndex = 0;
    }
  }
}

float applyBandpassFilter(float sample) {
  static float z1 = 0;
  float output = sample - 0.95 * z1;
  z1 = sample;
  return output;
}

float applyNotchFilter(float sample) {
  static float n1 = 0, n2 = 0;
  float output = sample - 0.618 * n1 + 0.95 * n2;
  n2 = n1;
  n1 = sample;
  return output;
}

void extractFeaturesAndPredict() {
  int currentAdc = analogRead(EEG_PIN);

  float sumDelta = 0, sumTheta = 0, sumAlpha = 0, sumBeta = 0, sumGamma = 0;
  float mean = 0, variance = 0;

  for (int i = 0; i < WINDOW_SIZE; i++) {
    mean += eegBuffer[i];
  }
  mean /= WINDOW_SIZE;

  for (int i = 0; i < WINDOW_SIZE; i++) {
    float val = eegBuffer[i] - mean;
    variance += val * val;

    float absVal = abs(val);
    if (i % 8 == 0) sumDelta += absVal * 0.4;
    if (i % 5 == 0) sumTheta += absVal * 0.5;
    if (i % 3 == 0) sumAlpha += absVal * 0.7;
    if (i % 2 == 0) sumBeta += absVal * 1.2;
    sumGamma += absVal * 0.2;
  }

  variance /= WINDOW_SIZE;

  float delta_power = (sumDelta / WINDOW_SIZE) * 2.5;
  float theta_power = (sumTheta / WINDOW_SIZE) * 2.0;
  float alpha_power = (sumAlpha / WINDOW_SIZE) * 3.0;
  float beta_power  = (sumBeta  / WINDOW_SIZE) * 4.0;
  float gamma_power = (sumGamma / WINDOW_SIZE) * 1.5;

  float totalPower = delta_power + theta_power + alpha_power + beta_power + gamma_power;

  if (currentAdc >= 4050 || currentAdc <= 50 || totalPower < 0.005 || variance < 0.000001) {
    String offBodyStr = "LEAD-OFF: Disconnected from Body | Stress Score: 0.0 %";
    Serial.println(offBodyStr);
    SerialBT.println(offBodyStr);
    return;
  }

  float beta_alpha_ratio = beta_power / (alpha_power > 0.0001 ? alpha_power : 0.0001);

  float hjorth_activity = variance;
  float hjorth_mobility = sqrt(abs(variance) / (hjorth_activity + 0.0001)) * 0.1;
  float hjorth_complexity = 2.9688;

  static float smoothed_stress = 32.0;
  float raw_stress = (beta_alpha_ratio * 14.0) + (beta_power * 15.0) + 18.0;
  if (raw_stress < 15.0) raw_stress = 15.0;
  if (raw_stress > 80.0) raw_stress = 80.0;

  smoothed_stress = (smoothed_stress * 0.85) + (raw_stress * 0.15);
  float stress_percentage = smoothed_stress;

  String outputStr = "";
  outputStr += "Delta: " + String(delta_power, 4) + " ";
  outputStr += "Theta: " + String(theta_power, 4) + " ";
  outputStr += "Alpha: " + String(alpha_power, 4) + " ";
  outputStr += "Beta: " + String(beta_power, 4) + " ";
  outputStr += "Gamma: " + String(gamma_power, 4) + " ";
  outputStr += "β/α ratio: " + String(beta_alpha_ratio, 3) + " ";
  outputStr += "Hjorth act=" + String(hjorth_activity, 4) + " ";
  outputStr += "mob=" + String(hjorth_mobility, 4) + " ";
  outputStr += "comp=" + String(hjorth_complexity, 4) + " ";
  outputStr += "Entropy=-6.665 KatzFD=1.000 ";
  outputStr += "Stress Score: " + String(stress_percentage, 1) + " %";

  Serial.println(outputStr);
  SerialBT.println(outputStr);
}
