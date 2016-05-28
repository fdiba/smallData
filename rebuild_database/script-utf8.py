import os;
import sys;
filePathSrc="F:\folder\capsules"
for root, dirs, files in os.walk(filePathSrc):
	for fn in files:
		if fn[-4:] != '.jar' and fn[-4:] != '.txt' and fn[-4:] != '.ear' and fn[-4:] != '.gif' and fn[-4:] != '.jpg' and fn[-5:] != '.jpeg' and fn[-4:] != '.xls' and fn[-4:] != '.GIF' and fn[-4:] != '.JPG' and fn[-5:] != '.JPEG' and fn[-4:] != '.XLS' and fn[-4:] != '.PNG' and fn[-4:] != '.png' and fn[-4:] != '.cab' and fn[-4:] != '.CAB' and fn[-4:] != '.ico':
			notepad.open(root + "\\" + fn)
			console.write(root + "\\" + fn + "\r\n")
			notepad.runMenuCommand("Encodage", "Convertir en UTF-8")
			notepad.save()
			notepad.close()
