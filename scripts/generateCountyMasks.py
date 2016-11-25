'''
Used to create the CountyMask data set
'''

import arcpy

masksFC = r"C:\inetpub\wwwroot\serverprojects\MapData\PLPCORoadsViewer\StaticData.gdb\CountyMasks"
countiesFC = r"Database Connections\SGID10_DirectConnect.sde\SGID10.BOUNDARIES.Counties"
blankFC = r'C:\TEMP\temp.gdb\mask'
tempFC = r'C:\TEMP\temp.gdb\temp_poly'

fldNum = 'COUNTYNBR'
fldName = 'NAME'
fldNumber = 'NUMBER'

countiesLayer = "countiesLayer"
masksLayer = "masksLayer"
blankLayer = 'blankLayer'

# set overwrite output
arcpy.env.OverWriteOutput = True

# make layers
print "\n" + "Making Feature Layers..."
arcpy.MakeFeatureLayer_management(countiesFC, countiesLayer)
arcpy.MakeFeatureLayer_management(blankFC, blankLayer)

# clear out shade features
print "\n" + "Deleting masks features"
arcpy.DeleteFeatures_management(masksFC)

## select 00 shades area
#print "\n" + "Selecting 00 shade area..."
#arcpy.SelectLayerByAttribute_management(shadesLayer, "NEW_SELECTION", fldAREA_NUM + " = '00'")
#ReportResult()

# get shades UpdateCursor
print "\n" + "Getting masks update cursor..."
masksInCur = arcpy.InsertCursor(masksFC)

# get cursor of all public works areas
print "\n" + "Getting counties cursor..."
countiesCur = arcpy.SearchCursor(countiesFC)

# loop through areas
print "\n" + "Looping through counties..."
for county in countiesCur:
    # get county number
    county_num = county.getValue(fldNum)
    
    # select area
    print "\n" + "Selecting County: " + county_num
    arcpy.SelectLayerByAttribute_management(countiesLayer, "NEW_SELECTION", fldNum + " = '" + county_num + "'")
    
    # run erase tool
    print "\n" + "Running Erase Tool..."
    if arcpy.Exists(tempFC):
        arcpy.Delete_management(tempFC)
    arcpy.Erase_analysis(blankLayer, countiesLayer, tempFC)
    
    # get erase feature
    print "\n" + "Getting erase feature..."
    eraseSC = arcpy.SearchCursor(tempFC)
    erase_row = eraseSC.next()
    
    # create new shades feature
    print "\n" + "Creating and populating new shades feature..."
    new_row = masksInCur.newRow()
    
    # populate area value
    new_row.setValue(fldNumber, county_num)
    new_row.setValue(fldName, county.getValue(fldName))
    
    # populate shape value
    new_row.SHAPE = erase_row.SHAPE
    
    # insert new row
    masksInCur.insertRow(new_row)
    
    # delete variables
    del new_row, erase_row, eraseSC
    
    # delete erase fc
    print "\n" + "Deleting erase feature class.."
    arcpy.Delete_management(tempFC)
    
print "\n\n" + "Done."
