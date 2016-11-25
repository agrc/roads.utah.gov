"""
createMagicZoomFCs

Used to initially create the magic zoom feature classes

2-6-2012
stdavis@utah.gov
"""

import arcpy, agrc

logger = agrc.logging.Logger()

DissolvesFGDB = r'C:\inetpub\wwwroot\serverprojects\MapData\PLPCORoadsViewer\DissolvedRoads.gdb'
magicZoomFGDB = r'C:\inetpub\wwwroot\serverprojects\MapData\PLPCORoadsViewer\MagicZoomData.gdb'
template = r'C:\inetpub\wwwroot\serverprojects\MapData\PLPCORoadsViewer\MagicZoomData.gdb\template'
counties = ['Kane'
##            'Beaver',
##            'Box_Elder',
##            'Carbon',
##            'Daggett',
##            'Duchesne',
##            'Emery',
##            'Garfield',
##            'Grand',
##            'Iron',
##            'Juab',
##            'Millard',
##            'Piute',
##            'Rich',
##            'SanJuan',
##            'Sanpete',
##            'Sevier',
##            'Tooele',
##            'Uintah',
##            'Utah',
##            'Washington',
##            'Wayne'
            ]

for c in counties:
    print c
    arcpy.CreateFeatureclass_management(magicZoomFGDB, c, 'POLYLINE', template)
    
    magicZoomFC = magicZoomFGDB + '//' + c
    
    logger.logMsg('Loading Features')
    arcpy.Append_management('%s//%sB' % (DissolvesFGDB, c), magicZoomFC, 'NO_TEST')
    logger.logGPMsg()
    
    logger.logMsg('Calculating ROAD_CLASS field')
    arcpy.CalculateField_management(magicZoomFC, 'ROAD_CLASS', '"Class B"')
    logger.logGPMsg()
    
    arcpy.Append_management('%s//%sD' % (DissolvesFGDB, c), magicZoomFC, 'NO_TEST')
    logger.logGPMsg()
    
    logger.logMsg('Selecting empty ROAD_CLASS values')
    lyr = arcpy.MakeFeatureLayer_management(magicZoomFC, 'layer', "ROAD_CLASS IS NULL")
    logger.logGPMsg()
    
    logger.logMsg('Calculating ROAD_CLASS field')
    arcpy.CalculateField_management(lyr, 'ROAD_CLASS', '"Class D"')
    logger.logGPMsg()
    
    logger.logMsg('Setting coordinate system')
    arcpy.DefineProjection_management(magicZoomFC, r'Coordinate Systems\NAD 1983 UTM Zone 12N.prj')
    logger.logGPMsg()
    
    arcpy.Delete_management(lyr)
    
print 'done'
