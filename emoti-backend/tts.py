# tts.py
from gtts import gTTS
import sys

text = sys.argv[1]
output_path = sys.argv[2]

tts = gTTS(text=text, lang='vi')
tts.save(output_path)

print("done")
