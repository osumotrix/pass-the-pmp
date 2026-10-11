import json,struct,sys,os
for f in sys.argv[1:]:
    d=open(f,'rb').read();n=struct.unpack('>I',d[:4])[0];h=json.loads(d[4:4+n]);b=4+n
    for k,(o,l) in h.items(): open(f'voices_raw/{k}.mp3','wb').write(d[b+o:b+o+l])
    print(f,len(h))
