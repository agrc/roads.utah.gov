"""
updatePLPCOFGDB.py
Pulls fresh data from PLPCO SDE database for dissolved roads and photos.
Creates optimized data for magic zoom widget by combining Class B &
D dissolved data into a single feature class for each county.

Scott Davis
2-6-2012
stdavis@utah.gov
"""

import arcpy, agrc, time

start_time = time.time()


sde = r'C:\PythonScripts\DatabaseConnections\PLPCO_DC.sde'

disFGDB = r'C:\inetpub\wwwroot\serverprojects\MapData\PLPCORoadsViewer\DissolvedRoads.gdb'
disSDE = sde + '\PLPCO.UOK.Roads_Dissolve'
photosFGDB = r'C:\inetpub\wwwroot\serverprojects\MapData\PLPCORoadsViewer\Photos.gdb'
photosSDE = sde + '\PLPCO.UOK.RoadPhotos'
backgroundFGDB = r'C:\inetpub\wwwroot\serverprojects\MapData\PLPCORoadsViewer\BackgroundLayers.gdb'
backgroundSDE = sde + '\PLPCO.UOK.Background_Layers'

magicZoomFGDB = r'C:\inetpub\wwwroot\serverprojects\MapData\PLPCORoadsViewer\MagicZoomData.gdb'
errors = []
counties = [
##            'Beaver',
##            'BoxElder',
##            'Carbon',
##            'Daggett',
##            'Duchesne',
##            'Emery',
##            'Garfield',
##            'Grand',
##            'Iron',
##            'Juab',
            'Kane'
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
fldROAD_CLASS = 'ROAD_CLASS'

logger = agrc.logging.Logger()
emailer = agrc.email.Emailer('stdavis@utah.gov', False)

def updateFGDB(fgd, sde):
    global errors, arcpy
    arcpy.env.workspace = fgd
    fcs = arcpy.ListFeatureClasses()
    
    logger.logMsg('Looping through: ' + fgd)
    for f in fcs:
        logger.logMsg('\nProcessing: ' + f)
        
        arcpy.env.workspace = sde
        sde_fcs = arcpy.ListFeatureClasses('*' + f)
        if len(sde_fcs) > 0:
            sde_fc = sde + '\\' + sde_fcs[0]
        else:
            msg = 'Could not find match in sde for: ' + f
            logger.logMsg(msg)
            errors.append(msg)
            continue
        
        logger.logMsg('Checking for schema changes')
        arcpy.env.workspace = fgd
        try:
            arcpy.MakeFeatureLayer_management(sde_fc, sde_fc + 'Layer', '1 = 2')
            logger.logGPMsg()
            
            arcpy.Append_management(sde_fc + 'Layer', f, 'TEST')
            logger.logGPMsg()
            logger.logMsg('Schema test passed')
        except arcpy.ExecuteError:
            msg = 'Schema Change Detected: ' + sde_fc
            logger.logMsg(msg)
            errors.append(msg)
            continue
        
        logger.logMsg('Deleting features')
        arcpy.DeleteFeatures_management(f)
        logger.logGPMsg()
        
        logger.logMsg('Loading Features')
        arcpy.Append_management(sde_fc, f, 'TEST')
        logger.logGPMsg()

try:
    updateFGDB(disFGDB, disSDE)
    updateFGDB(photosFGDB, photosSDE)
    updateFGDB(backgroundFGDB, backgroundSDE)
        
    logger.logMsg('Building magic zoom data')
    arcpy.env.workspace = disFGDB;
    for county in counties:
        logger.logMsg(county)
        
        matches = arcpy.ListFeatureClasses('*%s*' % (county))
        if len(matches) != 2:
            msg = 'Dissolve matches not found for: ' + county
            logger.logMsg(msg)
            errors.append(msg)
            continue
        
        magicZoomFC = magicZoomFGDB + '//' + county
        
        logger.logMsg('Deleting features')
        arcpy.DeleteFeatures_management(magicZoomFC)
        logger.logGPMsg()
        
        logger.logMsg('Loading Features')
        arcpy.Append_management(matches[0], magicZoomFC, 'NO_TEST')
        logger.logGPMsg()
        
        logger.logMsg('Calculating ROAD_CLASS field')
        arcpy.CalculateField_management(magicZoomFC, fldROAD_CLASS, '"Class %s"' % (matches[0][-1]))
        logger.logGPMsg()
        
        arcpy.Append_management(matches[1], magicZoomFC, 'NO_TEST')
        logger.logGPMsg()
        
        logger.logMsg('Selecting empty ROAD_CLASS values')
        lyr = arcpy.MakeFeatureLayer_management(magicZoomFC, 'layer', "%s IS NULL" % (fldROAD_CLASS))
        logger.logGPMsg()
        
        logger.logMsg('Calculating ROAD_CLASS field')
        arcpy.CalculateField_management(lyr, fldROAD_CLASS, '"Class %s"' % (matches[1][-1]))
        logger.logGPMsg()
        
        logger.logMsg('Deleting layer')
        arcpy.Delete_management(lyr)
        logger.logGPMsg()
        
    end_time = time.time()
    elapsed_time = end_time - start_time
    logger.logMsg('total minutes: ' + str(elapsed_time / 60))
    
    if len(errors) > 0:
        emailer.sendEmail(logger.scriptName + ' - Data Errors', '\n'.join(errors))
    else:
        emailer.sendEmail(logger.scriptName + ' - Finished Successfully', 'Nice job!')

except arcpy.ExecuteError:
    logger.logMsg('arcpy.ExecuteError')
    logger.logError()
    logger.logGPMsg()
    emailer.sendEmail(logger.scriptName + ' - arcpy.ExecuteError', logger.log)

except:
    logger.logError()
    emailer.sendEmail(logger.scriptName + ' - Python Error', logger.log)
    
logger.writeLogToFile()

print 'done'
