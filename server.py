__author__ = 'kjordan'

import cherrypy
import json
from glob import glob
import os
from streamlines import *

class HelloWorld(object):
    @cherrypy.expose
    def index(self):
        return "Hello world!"

    @cherrypy.expose
    @cherrypy.tools.json_out()
    @cherrypy.tools.json_in()
    def generate(self):
        result = {"operation": "request", "result": "success"}

        #dmetric = 35
        #iter = 0

        trkpath = '/Users/kjordan/repos/AFQ-viz/client/data/test_ExCap_L.trk'
        osls = loadtrkfile(trkpath)
        #ojsls = makejsontrk(osls)
        oclusters = executeclustering(osls, 50, 5)
        #savejson(clusters, '/Users/kjordan/repos/AFQ-viz/client/data/testingslfcpy.json', 15)
        #makejsonclusters(clusters)
        input_json = cherrypy.request.json  #this is the user information
        iter = input_json['iteration'] + 1
        print("IITTTTTEEERRRROOOOOOOOOOOOOO   " + str(iter))
        dmetric = int(input_json['distance_metric']*0.9)
        print("NEW DMETRIC "+str(dmetric))
        tstat = input_json['track_status']
        #qbcl = input_json['qbclusters']

        '''print("QBCL "+str(qbcl))

        if len(qbcl) < 1:
            clusters = oclusters
        else:
            clusters = qbcl'''

        clusters = oclusters

        sls = []
        for i,t in enumerate(tstat):
            if t:
                print("I = "+str(i))
                print(t)
                print "LENCL"
                print(clusters[i])
                print(len(list(clusters[i])))
                for p,k in enumerate(list(clusters[i])):
                    sls.append(k)
        print("LEN SLS "+str(len(sls)))
        print("Now clustering at "+str(dmetric))
        clusters = executeclustering(sls, dist_metric=dmetric)
        print("EXECUTED CL")
        jcsls = makejsonclusters(clusters)
        print("Made JSON clusters")

        #value = input_json #["my_key"]
        #value["my_key"] = 'this comes from client'
        #value["my_key"] = jsls
        print("making output json")
        output_json = {'clustered_sls' : jcsls, 'iteration': iter, 'distance_metric' : dmetric}
        print("successful...now returning it")
        #All responses are serialized to JSON. This the same as
        #return simplejson.dumps(result)
        #print("incoming data is", input_json)
        #input_json["new_thing"] = executeclustering(value["my_key"])
        return output_json

    @cherrypy.expose
    @cherrypy.tools.json_out()
    @cherrypy.tools.json_in()
    def generate_load(self):
        result = {"operation": "request", "result": "success"}
        input_json = cherrypy.request.json  #this is the user information
        print("Generate_load executed")
        trkpath = input_json["myfile"]
        print(trkpath)
        #trk,hdr = nib.trackvis.read(trkpath)
        #print(hdr)
        return input_json


if __name__ == '__main__':
    cherrypy.quickstart(HelloWorld(), "/", "Hello.config")