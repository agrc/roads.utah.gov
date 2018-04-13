'''
PLPCOPallet.py

Pulls fresh data from PLPCO SDE database for dissolved roads and photos.
Creates optimized data for sherlock widget by combining Class B &
D dissolved data into a single feature class for each county.
'''

from os.path import basename, join

import arcpy
from forklift.models import Pallet

counties = ['Beaver',
            'BoxElder',
            'Carbon',
            'Daggett',
            'Duchesne',
            'Emery',
            'Garfield',
            'Grand',
            'Iron',
            'Juab',
            'Kane',
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

fldROAD_CLASS = 'ROAD_CLASS'
fldName = 'Name'
fldYoutube_URL = 'Youtube_URL'
fldDateTimeS = 'DateTimeS'
fldCOUNTY = 'COUNTY'

shape_token = 'SHAPE@XY'

photos_name = 'Litigation_RoadPhotos'
video_log_name = 'Video_Log'
video_routes_dataset = 'VideoRoute'


class Base(Pallet):
    def build(self, config):
        self.log.info('building...')
        self.plpco_sde = join(self.garage, 'PLPCO.sde')
        self.plpco = join(self.staging_rack, 'plpco.gdb')

        self.copy_data = [self.plpco]

        self.arcgis_services = [('PLPCO/BackgroundLayers', 'MapServer'),
                                ('PLPCO/RoadsGeneral', 'MapServer'),
                                ('PLPCO/RoadsSecure', 'MapServer'),
                                ('PLPCO/SherlockData', 'MapServer'),
                                ('PLPCO/Videos', 'MapServer'),
                                ('PLPCO_washington/BackgroundLayers', 'MapServer'),
                                ('PLPCO_washington/RoadsGeneral', 'MapServer'),
                                ('PLPCO_washington/RoadsSecure', 'MapServer'),
                                ('PLPCO_washington/SherlockData', 'MapServer'),
                                ('PLPCO_washington/Videos', 'MapServer')]


class PLPCOPallet(Base):
    def build(self, config):
        super(PLPCOPallet, self).build(config)

        self.sgid = join(self.garage, 'SGID10.sde')
        self.reference_data = join(self.staging_rack, 'ReferenceData.gdb')

        self.add_crate((photos_name, self.plpco_sde, self.plpco))

        self.add_crates(['WildernessProp_RedRock', 'Wilderness_BLMWSAs'], {'source_workspace': self.sgid, 'destination_workspace': self.reference_data})


class PLPCOVideoPallet(Base):
    def build(self, config):
        super(PLPCOVideoPallet, self).build(config)

        self.videos = join(self.staging_rack, 'plpco_videos.gdb')

        self.copy_data = [self.videos]

        videoRouteFCs = []

        self.log.info('finding video logs and adding crates')
        for county in counties:
            name = 'PLPCO.UOK.{}'.format(county)
            if arcpy.Exists(join(self.plpco_sde, video_routes_dataset, name)):
                videoRouteFCs.append(name.split('.')[-1])

        self.add_crates(videoRouteFCs, {'source_workspace': join(self.plpco_sde, video_routes_dataset), 'destination_workspace': self.videos})
        self.add_crates([video_log_name], {'source_workspace': self.plpco_sde, 'destination_workspace': self.videos})

    def process(self):
        routes = join(self.videos, 'ROUTES')
        if not arcpy.Exists(routes):
            arcpy.management.CreateFeatureclass(self.videos, basename(routes), geometry_type='POINT', spatial_reference=arcpy.SpatialReference(3857))
            arcpy.management.AddField(routes, fldName, 'TEXT', field_length=20)
            arcpy.management.AddField(routes, fldDateTimeS, 'TEXT', field_length=32)
            arcpy.management.AddField(routes, fldCOUNTY, 'TEXT', field_length=15)

        for crate in [crate for crate in self.get_crates() if crate.was_updated() and crate.destination_name != video_log_name]:
            county = crate.destination_name
            self.log.info('populating video routes for: ' + county)

            #: clear out this county's data
            with arcpy.da.UpdateCursor(routes, ['OID@'], '{} = \'{}\''.format(fldCOUNTY, county)) as delete_cursor:
                for row in delete_cursor:
                    delete_cursor.deleteRow()

            with arcpy.da.Editor(self.videos), \
                    arcpy.da.SearchCursor(crate.destination, [fldName, fldDateTimeS, shape_token]) as source_cursor, \
                    arcpy.da.InsertCursor(routes, [fldName, fldDateTimeS, fldCOUNTY, shape_token]) as destination_cursor:
                for name, datetime, shape in source_cursor:
                    destination_cursor.insertRow((name, datetime, county, shape))


class PLPCORoadsPallet(Base):
    def build(self, config):
        super(PLPCORoadsPallet, self).build(config)

        datasets = [county + '_B' for county in counties] + [county + '_D' for county in counties]

        self.log.info('adding crates')
        self.add_crates(datasets, {'source_workspace': self.plpco_sde, 'destination_workspace': self.plpco})

    def process(self):
        self.log.info('Building combined datasets for sherlock')

        for crate in self.get_crates():
            if not crate.was_updated():
                continue

            self.log.info(crate.destination_name)

            request_def = 'REQUEST <> \'YES\''
            self.log.info('removing {} features'.format(request_def))
            with arcpy.da.UpdateCursor(crate.destination, 'OID@', request_def) as delete_cur:
                for row in delete_cur:
                    delete_cur.deleteRow()

            county, road_class_letter = crate.destination_name.split('_')
            road_class = 'Class ' + road_class_letter

            combined_dataset = join(self.plpco, county)

            if not arcpy.Exists(combined_dataset):
                self.log.info('Creating %s', combined_dataset)
                arcpy.CreateFeatureclass_management(self.plpco, county, 'POLYLINE', crate.destination, spatial_reference=arcpy.SpatialReference(3857))
                arcpy.AddField_management(combined_dataset, fldROAD_CLASS, 'TEXT', field_length=7)

            self.log.info('Deleting features')
            with arcpy.da.UpdateCursor(combined_dataset, 'OID@', '{} = \'{}\''.format(fldROAD_CLASS, road_class)) as ucur:
                for row in ucur:
                    ucur.deleteRow()

            self.log.info('Loading Features')
            arcpy.Append_management(crate.destination, combined_dataset, 'NO_TEST')

            self.log.info('Selecting empty ROAD_CLASS values')
            lyr = arcpy.MakeFeatureLayer_management(combined_dataset, 'layer', '{} IS NULL'.format(fldROAD_CLASS))

            self.log.info('Calculating ROAD_CLASS field')
            arcpy.CalculateField_management(lyr, fldROAD_CLASS, '"{}"'.format(road_class))

            self.log.info('Deleting layer')
            arcpy.Delete_management(lyr)
