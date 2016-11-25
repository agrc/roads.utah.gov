"""
updatePLPCOFGDBs.py
Pulls fresh data from PLPCO SDE database.
Creates optimized data for magic zoom widget by combining Class B &
D data into a single feature class for each county.
Updates CoA_AREA for dissolved feature classes.
Checks all sde features with a common RD_ID and makes sure that they have the same attributes.

Scott Davis
2-6-2012
stdavis@utah.gov
"""

import arcpy, agrc, time

start_time = time.time()

baseFolder = r'C:\inetpub\wwwroot\serverprojects\MapData\PLPCORoadsViewer'
SecureFGDB = baseFolder + r'\Secure.gdb'
DissolvesFGDB = baseFolder + r'\Dissolves.gdb'
MagicZoomsFGDB = baseFolder + r'\MagicZooms.gdb'
sde = r'C:\PythonScripts\DatabaseConnections\WDDR_DC.sde'
roadsDataset = 'WDDR.UOK.County_NOI_Roads'
sdeRoads = sde + '\\' + roadsDataset
photosDataset = 'WDDR.UOK.SurfaceFeatures_D'
sdePhotos = sde + '\\' + photosDataset
photosFGDB = baseFolder + r'\Photos.gdb'
errors = []
counties = [
            'Beaver',
            'Box_Elder',
            'Carbon',
            'Daggett',
            'Duchesne',
            'Emery',
#            'Garfield',
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
fields = {
        'CO_UNIQUE': 'CO_UNIQUE',
        'S_NAME': 'S_NAME',
        'S_WIDTH': 'S_WIDTH',
        'NOTES': 'NOTES',
        'RD_ID': 'RD_ID',
        'CLASS': 'CLASS',
        'TITLE': 'TITLE_V',
        'VERIFIED76': 'VERIFIED76',
        'VERIFIED24': 'VERIFIED24K',
        'VERIFIED15': 'VERIFIED15MIN',
        'AFFIDAVITS': 'AFFIDAVITS',
        'REC_STATUS':'REC_STATUS',
        'COMMENTS':'COMMENTS',
        'Miles': 'Miles',
        'CoA_AREA': 'CoA_AREA',
        'WITNESS1': 'WITNESS1',
        'WITNESS2': 'WITNESS2',
        'WITNESS3': 'WITNESS3',
        'BLM_LENGTH': 'BLM_LENGTH',
        'PROTECTION': 'PROTECTION',
        'UDOT': 'UDOT',
    }
currentCounty = ''
roadsService = r'PLPCORoadsViewer/Roads'

logger = agrc.logging.Logger()
emailer = agrc.email.Emailer('stdavis@utah.gov')
services = agrc.agserver.Services()

def updateField(secRow, sdeRow, fld):
    global errors, logger, currentCounty
    try:
        value = sdeRow.getValue(fld)
        
        secRow.setValue(fld, value)
    except:
        logger.logError()
        msg = '%s: No field: %s found in sde feature class' % (currentCounty, fld)
        logger.logMsg(msg)
        errors.append(msg)

def updateAttributes(sec, sde):
    global errors, logger, fields, currentCounty
    
    logger.logMsg('\n\nupdating %s with %s' % (sec, sde))
    
    sdeLayer = arcpy.MakeFeatureLayer_management(sde, 'sdeLayer')
    logger.logGPMsg()
    
    secRows = arcpy.UpdateCursor(sec)
    for secRow in secRows:
        rdid = secRow.getValue(fields['RD_ID'])
        if rdid == '' or rdid == None:
            raise NameError('Blank RD_ID!')
        logger.logMsg(currentCounty + ' - RD_ID: ' + rdid)
        query = "%s = '%s'" % (fields['RD_ID'], rdid)
        arcpy.SelectLayerByAttribute_management(sdeLayer, 'NEW_SELECTION', query)
        logger.logGPMsg(False)
        count = arcpy.GetCount_management(sdeLayer)
        logger.logGPMsg(False)
        if str(count) == '0':
            msg = '%s: No matching section rows in sde found for RD_ID: %s' % (currentCounty, rdid)
            logger.logMsg(msg)
            errors.append(msg)
        else:
            checkSDEAttributes(arcpy.SearchCursor(sde, query), sec)
            
            sdeRows = arcpy.SearchCursor(sde, query)
            sdeRow = sdeRows.next()
            for fld in fields:
                updateField(secRow, sdeRow, fields[fld])
            
            secRows.updateRow(secRow)
            
            del sdeRows, sdeRow
    
    del secRows, secRow
    arcpy.Delete_management(sdeLayer)
    
    logger.logMsg('Updating dissolved features')
    dis = DissolvesFGDB + '\\' + sec
    
    arcpy.DeleteField_management(dis, fields['CoA_AREA'])
    logger.logGPMsg()
    
    arcpy.JoinField_management(dis, fields['RD_ID'], sec, fields['RD_ID'], [fields['CoA_AREA']])
    logger.logGPMsg()
    
def checkSDEAttributes(cur, sec):
    global errors, logger, fields
    
    logger.logMsg('Checking sde features to make sure that they have consistent attribute values', False)
    
    row = cur.next()
    values = {'OBJECTID': row.OBJECTID}
    for fld in fields:
        f = fields[fld]
        values[f] = row.getValue(f)
    row = cur.next()
    while row:
        for fld in fields:
            f = fields[fld]
            if values[f] != row.getValue(f):
                msg = 'Mismatching values for %s between OID: %s & OID: %s in %s' % (f, values['OBJECTID'], row.OBJECTID, sec)
                logger.logMsg(msg)
                errors.append(msg)
        
        row = cur.next()
    del cur, row
        
try:
    services.stopMapService(roadsService)
    
    arcpy.env.workspace = SecureFGDB
    logger.logMsg('looping through secure feature classes')
    for cnty in counties:
        secureB = '%sB' % (cnty)
        secureD = '%sD' % (cnty)
        
        if cnty != 'Box_Elder':
            sdeB = '%s\\WDDR.UOK.%s_NOI_B' % (sdeRoads, cnty)
            sdeD = '%s\\WDDR.UOK.%s_NOI_D' % (sdeRoads, cnty)
        else:
            sdeB = '%s\\WDDR.UOK.BoxElder_NOI_B' % (sdeRoads)
            sdeD = '%s\\WDDR.UOK.BoxElder_NOI_D' % (sdeRoads)
        
        currentCounty = secureB
        updateAttributes(secureB, sdeB)
        currentCounty = secureD
        updateAttributes(secureD, sdeD)
        
    logger.logMsg('Deleting old photo feature classes')
    arcpy.env.workspace = photosFGDB
    fcs = arcpy.ListFeatureClasses()
    for f in fcs:
        arcpy.Delete_management(f)
        logger.logGPMsg()
        
    logger.logMsg('Importing photo feature classes')
    arcpy.env.workspace = sdePhotos
    fcs = arcpy.ListFeatureClasses('*Events*')
    for f in fcs:
        arcpy.FeatureClassToFeatureClass_conversion(f, photosFGDB, f[9:])
        logger.logGPMsg()
        
    end_time = time.time()
    elapsed_time = end_time - start_time
    logger.logMsg('total minutes: ' + str(elapsed_time / 60))
    
    if len(errors) > 0:
        emailer.sendEmail(logger.scriptName + ' - Data Errors', '\n'.join(errors))
    else:
        emailer.sendEmail(logger.scriptName + ' - Finished Successfully', logger.log)

except arcpy.ExecuteError:
    logger.logMsg('arcpy.ExecuteError')
    logger.logError()
    logger.logGPMsg()
    emailer.sendEmail(logger.scriptName + ' - arcpy.ExecuteError', logger.log)

except:
    logger.logError()
    emailer.sendEmail(logger.scriptName + ' - Python Error', logger.log)
    
logger.logMsg('Starting roads service')
services.startMapService(roadsServices)
logger.writeLogToFile()

print 'done'
