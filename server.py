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

        trkpath = '/Users/kjordan/repos/AFQ-viz/client/data/test_ExCap_L.trk'
        sls = loadtrkfile(trkpath)
        jsls = makejsontrk(sls)
        clusters = executeclustering(sls, dist_metric=50)
        jcsls = makejsonclusters(clusters)
        #clusters = executeclustering(trkpath, 35, 5)
        #savejson(clusters, '/Users/kjordan/repos/AFQ-viz/client/data/testingslfcpy.json', 15)
        #makejsonclusters(clusters)
        input_json = cherrypy.request.json  #this is the user information
        #value = input_json #["my_key"]
        #value["my_key"] = 'this comes from client'
        #value["my_key"] = jsls
        output_json = jcsls

        #All responses are serialized to JSON. This the same as
        #return simplejson.dumps(result)
        #print("incoming data is", input_json)
        #input_json["new_thing"] = executeclustering(value["my_key"])
        return output_json



if __name__ == '__main__':
    cherrypy.quickstart(HelloWorld(), "/", "Hello.config")
    #cherrypy.config.update({'server.socket_port': 8090})
    #cherrypy.engine.restart()
