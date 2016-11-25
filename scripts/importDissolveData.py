'''
Used to import the dissolve data from the p drive to a local file geodatabase
'''
import arcpy

mxd = r'c:\inetpub\wwwroot\serverprojects\PLPCORoadsViewer\Roads.mxd'
newmxd = r'c:\inetpub\wwwroot\serverprojects\PLPCORoadsViewer\RoadsNEW.mxd'
fgd = r'C:\inetpub\wwwroot\serverprojects\MapData\PLPCORoadsViewer\Dissolves.gdb'

mxd = arcpy.mapping.MapDocument(mxd)
lyrs = arcpy.mapping.ListLayers(mxd)

arcpy.env.overwriteOutput = True

for l in lyrs:
    print l.name
    if not l.isGroupLayer:
        try:
            test = l.serviceProperties
        except:
            print l.dataSource
            name = l.datasetName.replace(' ', '_').replace('.shp', '').replace('.', '').replace('<', '')
            print name
            
            if not arcpy.Exists(fgd + '\\' + name):
                arcpy.FeatureClassToFeatureClass_conversion(l.dataSource, fgd, name)
                print arcpy.GetMessages()
                
                l.replaceDataSource(fgd, 'FILEGDB_WORKSPACE', name)
                print 'data source replaced'
            else:
                print 'skipping ' + name

mxd.saveACopy(newmxd)