"""
createMagicZoomFCs

Used to initially create the magic zoom feature classes

2-6-2012
stdavis@utah.gov
"""

import arcpy

FGDB = r'C:\inetpub\wwwroot\serverprojects\MapData\PLPCORoadsViewer\Secure.gdb'
dissolvesFGDB = r'C:\inetpub\wwwroot\serverprojects\MapData\PLPCORoadsViewer\Dissolves.gdb'
template = r'C:\inetpub\wwwroot\serverprojects\MapData\PLPCORoadsViewer\Secure.gdb\template'
counties = ['Beaver',
            'Box_Elder',
            'Carbon',
            'Daggett',
            'Duchesne',
            'Emery',
            'Garfield',
            'Grand',
            'Iron',
            'Juab',
            'Millard',
            'Piute',
            'Rich',
            'SanJuan',
            'Sanpete',
            'Sevier',
            'Tooele',
            'Uintah',
            'Utah',
            'Washington',
            'Wayne']

for c in counties:
    name = c + 'B'
    print name
    arcpy.CreateFeatureclass_management(FGDB, name, 'POLYLINE', template)
    arcpy.Append_management(dissolvesFGDB + '//' + name, FGDB + '//' + name, 'NO_TEST')
    print arcpy.GetMessages()
    
    name = c + 'D'
    print name
    arcpy.CreateFeatureclass_management(FGDB, name, 'POLYLINE', template)
    arcpy.Append_management(dissolvesFGDB + '//' + name, FGDB + '//' + name, 'NO_TEST')
    print arcpy.GetMessages()