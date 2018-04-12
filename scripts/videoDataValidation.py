'''
videoDataValidation.py

This script looks for errors in the roads video data that would prevent roads.utah.gov from working properly.

Specifically, it checks that:
- all RD_ID values in the log table have corresponding features in the roads feature classes (B & D)
- all Name values in the log table have corresponding features in the routes feature class
- all Youtube_URL values in the log table have valid video IDs that can be extracted.

You may need to run `pip install requests` to install the requests module.
'''
from os.path import join

import arcpy
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
SDE = r'Database Connections\PLPCO.sde'
VIDEO_ROUTE_DS = r'PLPCO.UOK.VideoRoute'
ROADS_DISSOLVE_DS = r'PLPCO.UOK.Roads_Dissolve'
LOG_TABLE_NAME = 'PLPCO.UOK.Video_Log'
ROAD_TYPES = ['B', 'D']

fldRD_ID = 'RD_ID'
fldName = 'Name'
fldYoutube_URL = 'Youtube_URL'
fldName = 'Name'
fldGPX_Name = 'GPX_Name'


def get_id_from_url(url):
    if url.find('=') > 0:
        return url.split('=').pop()
    elif url.find('/') > 0:
        return url.split('/').pop()

    return ''


print('building gps_names list from route feature classes')
gpx_names = set([])
for county in COUNTIES:
    print('county: ' + county)

    route_fc = join(SDE, VIDEO_ROUTE_DS, county)
    if arcpy.Exists(route_fc):
        with arcpy.da.SearchCursor(route_fc, [fldName]) as cursor:
            for name, in cursor:
                gpx_names.add(name)

print('building rd_id list from dissolve feature classes')
rd_ids = []
for county in COUNTIES:
    print('county: ' + county)

    for road_type in ROAD_TYPES:
        with arcpy.da.SearchCursor(join(SDE, ROADS_DISSOLVE_DS, 'PLPCO.UOK.{}_{}'.format(county, road_type)), [fldRD_ID]) as cursor:
            for row in cursor:
                rd_ids.append(row[0])

print('looping through log table')
query = '{0} IS NOT NULL AND {1} IS NOT NULL'.format(fldGPX_Name, fldYoutube_URL)
with arcpy.da.SearchCursor(join(SDE, LOG_TABLE_NAME), [fldRD_ID, fldGPX_Name, fldYoutube_URL], query) as cursor:
    for rd_id, gpx, youtube in cursor:
        if rd_id not in rd_ids:
            print('missing RD_ID: {} dissolved feature classes'.format(rd_id, county))
        if gpx not in gpx_names:
            print('missing: "{}" gpx name in video routes'.format(gpx))
        id = get_id_from_url(youtube)
        response = requests.get('https://www.youtube.com/oembed?format=json&url=http://www.youtube.com/watch?v=' + id)
        if response.status_code != 200:
            print('invalid youtube id: ' + id)

print('done')
