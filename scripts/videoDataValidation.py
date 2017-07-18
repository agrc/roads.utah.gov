'''
videoDataValidation.py

This script looks for errors in the roads video data that would prevent roads.utah.gov from working properly.

Specifically, it checks that:
- all RD_ID values in the log table have corresponding features in the roads feature classes (B & D)
- all GPX_Name values in the log table have corresponding feature classes in the VideoRoute feature dataset.
- all Youtube_URL values in the log table have valid video IDs that can be extracted.

You may need to run `pip install requests` to install the requests module.
'''
import arcpy
from os.path import join
import requests


COUNTIES = ['Beaver',
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
SDE = r'X:\roads.utah.gov\scripts\PLPCO.sde'
VIDEO_ROUTE_DS = r'PLPCO.UOK.VideoRoute'
ROADS_DISSOLVE_DS = r'PLPCO.UOK.Roads_Dissolve'
LOG = 'PLPCO.UOK.{}_CO_VIDEO_LOG'
ROAD_TYPES = ['B', 'D']

fldRD_ID = 'RD_ID'
fldGPX_Name = 'GPX_Name'
fldYoutube_URL = 'Youtube_URL'

print('building video routes feature class list')
arcpy.env.workspace = SDE
videoRoutes = [fc.split('.')[-1] for fc in arcpy.ListFeatureClasses(feature_dataset=VIDEO_ROUTE_DS)]


def get_id_from_url(url):
    if url.find('=') > 0:
        return url.split('=').pop()
    elif url.find('/') > 0:
        return url.split('/').pop()

    return ''


for county in COUNTIES:
    log_name = LOG.format(county)
    log = join(SDE, log_name)

    rd_ids = []
    for road_type in ROAD_TYPES:
        with arcpy.da.SearchCursor(join(SDE, ROADS_DISSOLVE_DS, 'PLPCO.UOK.{}_{}'.format(county, road_type)), [fldRD_ID]) as cursor:
            for row in cursor:
                rd_ids.append(row[0])

    if arcpy.Exists(log):
        print('\n')
        print('validating: ' + log_name)

        with arcpy.da.SearchCursor(log, [fldRD_ID, fldGPX_Name, fldYoutube_URL], '{} IS NOT NULL'.format(fldGPX_Name)) as cursor:
            for rd_id, gpx, youtube in cursor:
                if rd_id not in rd_ids:
                    print('missing RD_ID: {0} in {1}_B or {1}_D feature classes'.format(rd_id, county))
                if gpx not in videoRoutes:
                    print('missing: "{}" video route feature class'.format(gpx))
                id = get_id_from_url(youtube)
                response = requests.get('https://www.youtube.com/oembed?format=json&url=http://www.youtube.com/watch?v=' + id)
                if response.status_code != 200:
                    print('invalid youtube id: ' + id)

print('done')
