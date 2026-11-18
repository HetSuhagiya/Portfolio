import json,base64,sys,glob,os
# Decode the newest CDP screenshot response into .shots/<name>.jpg
files=sorted(glob.glob(os.path.expanduser('~/.cursor/browser-logs/cdp-response-Page.captureScreenshot-*.json')), key=os.path.getmtime)
d=json.load(open(files[-1]))
data=d.get('data') or d.get('result',{}).get('data')
out=os.path.join(os.path.dirname(__file__), sys.argv[1]+'.jpg')
open(out,'wb').write(base64.b64decode(data))
print(out, os.path.getsize(out))
