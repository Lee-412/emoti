# recognize.py
import sys
import json
import wave
from vosk import Model, KaldiRecognizer

model_path = "vosk-model-small-vn-0.3"

def transcribe(file_path):
    wf = wave.open(file_path, "rb")
    if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getcomptype() != "NONE":
        print(json.dumps({"error": "File không hợp lệ (mono PCM 16bit)."}))
        return

    model = Model(model_path)
    rec = KaldiRecognizer(model, wf.getframerate())

    result = ""
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            res = json.loads(rec.Result())
            result += res.get("text", "") + " "

    final_res = json.loads(rec.FinalResult())
    result += final_res.get("text", "")
    print(json.dumps({"text": result.strip()}))

if __name__ == "__main__":
    transcribe(sys.argv[1])
