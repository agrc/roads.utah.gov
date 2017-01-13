#!/usr/bin/env python
# * coding: utf8 *
'''
PLPCOPallet.py

Pulls fresh data from PLPCO SDE database for dissolved roads and photos.
Creates optimized data for sherlock widget by combining Class B &
D dissolved data into a single feature class for each county.
'''

import arcpy
from forklift.models import Pallet, Crate
from os.path import join


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
photos_name = 'Litigation_RoadPhotos'


class PLPCOPallet(Pallet):
    def build(self, config):
        self.staging = r'C:\Scheduled\staging'
        self.plpco_sde = join(self.garage, 'PLPCO.sde')
        self.plpco = join(self.staging, 'plpco.gdb')
        self.sgid = join(self.garage, 'SGID10.sde')

        self.copy_data = [self.plpco]

        self.arcgis_services = [('PLPCO/BackgroundLayers', 'MapServer'),
                                ('PLPCO/RoadsGeneral', 'MapServer'),
                                ('PLPCO/RoadsSecure', 'MapServer')]

        datasets = [county + '_B' for county in counties] + [county + '_D' for county in counties]

        self.log.info('adding crates')
        self.add_crates(datasets, {'source_workspace': self.plpco_sde, 'destination_workspace': self.plpco})
        self.add_crate((photos_name, self.plpco_sde, self.plpco))

    def is_ready_to_ship(self):
        return True

    def requires_processing(self):
        return True

    def process(self):
        self.log.info('Building combined datasets for sherlock')

        for crate in self.get_crates():
            if crate.result[0] not in [Crate.CREATED, Crate.UPDATED]:
                continue

            self.log.info(crate.destination_name)

            if crate.destination_name != photos_name:
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
