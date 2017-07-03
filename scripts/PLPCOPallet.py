'''
PLPCOPallet.py

Pulls fresh data from PLPCO SDE database for dissolved roads and photos.
Creates optimized data for sherlock widget by combining Class B &
D dissolved data into a single feature class for each county.
'''

import arcpy
from forklift.models import Pallet, Crate
from os.path import join, basename


counties = ['Beaver',
            # 'BoxElder',
            # 'Carbon',
            # 'Daggett',
            # 'Duchesne',
            # 'Emery',
            'Garfield',
            # 'Grand',
            # 'Iron',
            # 'Juab',
            # 'Kane',
            # 'Millard',
            # 'Piute',
            # 'Rich',
            # 'SanJuan',
            # 'Sanpete',
            # 'Sevier',
            # 'Tooele',
            # 'Uintah',
            # 'Utah',
            # 'Washington',
            'Wayne']

fldROAD_CLASS = 'ROAD_CLASS'
fldRD_ID = 'RD_ID'
fldGPX_Name = 'GPX_Name'
fldYoutube_URL = 'Youtube_URL'
fldDateTimeS = 'DateTimeS'
fldGPX_in_Database = 'GPX_in_Database'

shape_token = 'SHAPE@XY'

photos_name = 'Litigation_RoadPhotos'
video_log_name = '{}_CO_VIDEO_LOG'


class PLPCOBasePallet(Pallet):
    def build(self, config):
        self.log.info('building...')
        self.plpco_sde = join(self.garage, 'PLPCO.sde')
        self.plpco = join(self.staging_rack, 'plpco.gdb')

        self.copy_data = [self.plpco]

        self.arcgis_services = [('PLPCO/BackgroundLayers', 'MapServer'),
                                ('PLPCO/RoadsGeneral', 'MapServer'),
                                ('PLPCO/RoadsSecure', 'MapServer'),
                                ('PLPCO/SherlockData', 'MapServer')]


# class PLPCOPallet(PLPCOBasePallet):
#     def build(self, config):
#         super(PLPCOPallet, self).build()
#
#         self.add_crate((photos_name, self.plpco_sde, self.plpco))


class PLPCOVideoPallet(PLPCOBasePallet):
    def build(self, config):
        super(PLPCOVideoPallet, self).build(config)

        self.videos = join(self.staging_rack, 'plpco_videos.gdb')

        self.copy_data = [self.videos]

        table_names = []

        self.log.info('finding video logs and adding crates')
        for county in counties:
            name = 'PLPCO.UOK.{}_CO_VIDEO_LOG'.format(county.upper())
            if arcpy.Exists(join(self.plpco_sde, name)):
                table_names.append(name.split('.')[-1])

        self.add_crates(table_names, {'source_workspace': self.plpco_sde, 'destination_workspace': self.videos})

    def process(self):
        for crate in [crate for crate in self.get_crates() if crate.result[0] in [Crate.CREATED, Crate.UPDATED]]:
            self.log.info('populating video routes for: ' + crate.destination_name)
            name = crate.source_name.split('_')[0] + '_routes'
            routes = join(self.videos, name)
            if not arcpy.Exists(routes):
                arcpy.management.CreateFeatureclass(self.videos, name, geometry_type='POINT', spatial_reference=arcpy.SpatialReference(3857))
                arcpy.management.AddField(routes, fldRD_ID, 'TEXT', field_length=20)
                arcpy.management.AddField(routes, fldGPX_Name, 'TEXT', field_length=20)
                arcpy.management.AddField(routes, fldDateTimeS, 'TEXT', field_length=32)
            else:
                arcpy.management.TruncateTable(routes)

            log_query = '{} IS NOT NULL AND {} IS NOT NULL'.format(fldGPX_Name, fldGPX_in_Database)
            with arcpy.da.SearchCursor(crate.destination, [fldRD_ID, fldGPX_Name], log_query) as log_cursor, \
                    arcpy.da.InsertCursor(routes, [fldRD_ID, fldGPX_Name, fldDateTimeS, shape_token]) as routes_cursor:
                for rd_id, gpx_name in log_cursor:
                    gpx_fc = join(self.plpco_sde, 'PLPCO.UOK.VideoRoute', 'PLPCO.UOK.' + gpx_name)
                    try:
                        with arcpy.da.SearchCursor(gpx_fc, [fldDateTimeS, shape_token]) as gpx_cursor:
                            for datetime, shape in gpx_cursor:
                                routes_cursor.insertRow((rd_id, gpx_name, datetime, shape))
                    except RuntimeError:
                        msg = 'Missing video route: {}'.format(gpx_name)
                        if self.success[0]:
                            self.success = (False, msg)
                        else:
                            self.success = (False, self.success[1] + '\n' + msg)
                        self.log.warning(msg)


# class PLPCORoadsPallet(PLPCOBasePallet):
#     def build(self, config):
#         super(PLPCOBasePallet, self).build(config)
#
#         datasets = [county + '_B' for county in counties] + [county + '_D' for county in counties]
#
#         self.log.info('adding crates')
#         self.add_crates(datasets, {'source_workspace': self.plpco_sde, 'destination_workspace': self.plpco})
#
#     def process(self):
#         self.log.info('Building combined datasets for sherlock')
#
#         for crate in self.get_crates():
#             if crate.result[0] not in [Crate.CREATED, Crate.UPDATED]:
#                 continue
#
#             self.log.info(crate.destination_name)
#
#             request_def = 'REQUEST <> \'YES\''
#             self.log.info('removing {} features'.format(request_def))
#             with arcpy.da.UpdateCursor(crate.destination, 'OID@', request_def) as delete_cur:
#                 for row in delete_cur:
#                     delete_cur.deleteRow()
#
#             county, road_class_letter = crate.destination_name.split('_')
#             road_class = 'Class ' + road_class_letter
#
#             combined_dataset = join(self.plpco, county)
#
#             if not arcpy.Exists(combined_dataset):
#                 self.log.info('Creating %s', combined_dataset)
#                 arcpy.CreateFeatureclass_management(self.plpco, county, 'POLYLINE', crate.destination, spatial_reference=arcpy.SpatialReference(3857))
#                 arcpy.AddField_management(combined_dataset, fldROAD_CLASS, 'TEXT', field_length=7)
#
#             self.log.info('Deleting features')
#             with arcpy.da.UpdateCursor(combined_dataset, 'OID@', '{} = \'{}\''.format(fldROAD_CLASS, road_class)) as ucur:
#                 for row in ucur:
#                     ucur.deleteRow()
#
#             self.log.info('Loading Features')
#             arcpy.Append_management(crate.destination, combined_dataset, 'NO_TEST')
#
#             self.log.info('Selecting empty ROAD_CLASS values')
#             lyr = arcpy.MakeFeatureLayer_management(combined_dataset, 'layer', '{} IS NULL'.format(fldROAD_CLASS))
#
#             self.log.info('Calculating ROAD_CLASS field')
#             arcpy.CalculateField_management(lyr, fldROAD_CLASS, '"{}"'.format(road_class))
#
#             self.log.info('Deleting layer')
#             arcpy.Delete_management(lyr)
#
