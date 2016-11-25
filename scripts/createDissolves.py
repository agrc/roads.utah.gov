'''
createDissolves.py

Used to create dissolve feature classes from the roads data in sde
'''

import arcpy

dissolves = r'C:\inetpub\wwwroot\serverprojects\MapData\PLPCORoadsViewer\DissolvedRoads.gdb'
roads = r'Database Connections\PLPCO_DC.sde\PLPCO.UOK.CountyComplaintRoads'
RD_ID = 'RD_ID'
fields = ['CO_UNIQUE',
        'S_NAME',
        'S_WIDTH',
        'NOTES',
        'RD_ID',
        'CLASS',
        'TITLE_V',
        'VERIFIED76',
        'VERIFIED24K',
        'VERIFIED15MIN',
        'AFFIDAVITS',
        'REC_STATUS',
        'COMMENTS',
        'Miles',
        'CoA_AREA',
        'WITNESS1',
        'WITNESS2',
        'WITNESS3',
        'BLM_LENGTH',
        'PROTECTION',
        'UDOT']

print 'deleting all previous feature classes'
arcpy.env.workspace = dissolves

fcs = arcpy.ListFeatureClasses()
for f in fcs:
    print f
    arcpy.Delete_management(f)
    
print 'looping through sde feature classes'
arcpy.env.workspace = roads

fcs = arcpy.ListFeatureClasses()
for f in fcs:
    parts = f[10:].split('_')
    newname = parts[0] + parts[2]
    print newname
    arcpy.Dissolve_management(f, dissolves + '//' + newname, RD_ID)
    
    arcpy.JoinField_management(dissolves + '//' + newname, RD_ID, f, RD_ID, fields)