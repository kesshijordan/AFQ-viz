from dipy.segment.clustering import QuickBundles
from dipy.io.pickles import save_pickle
from scipy.spatial import ConvexHull
from scipy.optimize import minimize
import numpy as np
import nibabel as nib
import json
from glob import glob
import os

def do_something(fromclient):
    fromserver = fromclient+'ibefromserver'
    return fromserver

def get_center(streamlines):
    centers = np.zeros([len(streamlines),3])
    for i,sl in enumerate(streamlines):
        #print np.mean(sl,axis=0)
        centers[i,0] = np.mean(sl,axis=0)[0]
        centers[i,1] = np.mean(sl,axis=0)[1]
        centers[i,2] = np.mean(sl,axis=0)[2]
    the_center = np.mean(centers, axis=0)
    return the_center

def center_sls(streamlines):
    sls_centroid = get_center(streamlines)
    newsls =[]
    for i,sl in enumerate(streamlines):
        newsls.append(sl-sls_centroid)
    return newsls

def execute_qb(streamlines, dist_metric, smcl=5):
    qb = QuickBundles(threshold=dist_metric)
    clusters = qb.cluster(streamlines)
    print("Nb. clusters:", len(clusters))
    print("Cluster sizes:", map(len, clusters))
    print("N Small clusters:", sum(clusters < smcl))
    print("N Large clusters:", sum(clusters >= smcl))
    #print("Streamlines indices of the first cluster:\n", clusters[0].indices)
    #print("Centroid of the last cluster:\n", clusters[-1].centroid)
    #save_pickle('QB.pkl', clusters)
    return clusters

def get_qbparams(clusters, clszthr):
    return sum(clusters >= clszthr)

def execute_savecsv(path, clusters):
    import csv
    #clusters = clusters.get_large_clusters(50)
    clusters=clusters
    csvpath = path
    mycsv = csv.writer(open(csvpath,"w"), delimiter=',')
    mycsv.writerow(['dist_metric=', dist_metric, 'grand_tot=', len(clusters), 'tot=', len(clusters)])
    mycsv.writerow(['track','tot_cluster', 'clusternum', 'clustersz'])

    for i,cl in enumerate(clusters):
        mycsv.writerow([trkdir.split('/')[-1], len(clusters), i, len(cl)])

def makejsontrk(streamline, bigclthr=5):
    #clusters = clusters.get_large_clusters(bigclthr)
    # Select one of these:
    #streamline_idx = 20
    #json_streamline = json.dumps({streamline_idx:streamline.tolist()})
    jump_step = 5
    json_streamlines = {}
    json_bundles = {}
    # loop through all fibers
    for bundle_idx in range(0, 1):
        bundle = streamline
        # loop through the selected bundle and put all lines into another variable
        for streamline_idx in range(0, len(bundle), jump_step):
            streamline = bundle[streamline_idx]
            streamline = streamline[1::5]
            json_streamlines[streamline_idx] = streamline.tolist()
        # then put this fiber into bundles set
        json_bundles[bundle_idx] = json_streamlines
        # and refresh json_streamlines
        json_streamlines = {}
    return json_bundles

def makejsonclusters(clusters, bigclthr=5):
    #clusters = clusters.get_large_clusters(bigclthr)
    # Select one of these:
    #streamline_idx = 20
    streamline = list(clusters[0])
    #json_streamline = json.dumps({streamline_idx:streamline.tolist()})
    jump_step = 5
    json_streamlines = {}
    json_bundles = {}
    # loop through all fibers
    for bundle_idx in range(len(clusters)):
        bundle = list(clusters[bundle_idx])
        # loop through the selected bundle and put all lines into another variable
        for streamline_idx in range(0, len(bundle), jump_step):
            streamline = bundle[streamline_idx]
            streamline = streamline[1::5]
            json_streamlines[streamline_idx] = streamline.tolist()

        # then put this fiber into bundles set
        json_bundles[bundle_idx] = json_streamlines
        # and refresh json_streamlines
        json_streamlines = {}

    # print (len(json_bundles))
    # finally, write this bundles set into external file
    #with open(savepath, 'w') as outfile:
    #    json.dump(json_bundles, outfile)
    return json_bundles

def op_qbparams_func(streamlines, dmetric=50, clszthr=5):
    clusters = execute_qb(streamlines, dmetric)
    return abs(sum(clusters >= clszthr)-10)

def find_nbundles(streamlines, nbundles=10, initdistmetric=50, clszthr=5):
    dmetric_list = [initdistmetric]
    distmetric = initdistmetric
    bundles = execute_qb(streamlines,50)
    Nbigcl = sum(bundles >= clszthr)
    if len(streamlines) > np.multiply(nbundles,clszthr):
        #a=minimize(op_qbparams_func, np.array([initdistmetric]))
        cval = Nbigcl-nbundles
        while (cval > 0 or cval < -2):
            print distmetric
            if Nbigcl < nbundles:
                distmetric -= int(np.mean([distmetric,dmetric_list[-1]])/10)
                bundles = execute_qb(streamlines,distmetric)
            else:
                distmetric += int(np.mean([distmetric,dmetric_list[-1]])/10)
                bundles = execute_qb(streamlines,distmetric)
            Nbigcl = sum(bundles >= clszthr)
            dmetric_list.append(distmetric)
            cval = Nbigcl-nbundles
    return distmetric, Nbigcl, bundles

def loadtrkfile(trkfile):
    trk,hdr = nib.trackvis.read(trkfile)
    sls = [item[0] for item in trk]
    return sls

def executeclustering(sls, dist_metric=50, smcl=5):
    csls = center_sls(sls)
    clusters = execute_qb(csls, dist_metric, smcl=5)
    return clusters
