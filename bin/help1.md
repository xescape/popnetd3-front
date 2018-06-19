###**Welcome to PopNet-D3**

This is the D3-based implementation of PopNet, an analysis and visualization tool for population genetics. PopNet-D3 allows for
the simple, streamlined analysis of your population of interest without the hassel of linux, programming, or external packages.
Popnet-D3 employs the D3 package to produce robust visualizations that facilitate the discovery of inter- and intra-species genetic relationships. 

####Quick Start Guide####

**Running a Job**

The 'Submit Job' tab lets you submit a data to our server to be analyzed by PopNet. Please refer to the tool tip in each section 
for guidelines on the parameters. Currently we only accept tabular formatted data sets. See an example [here](./bin/toxo20.txt).
You will receive an email notification upon completion of your job with a job id, used to retreive your job. A typical job involving 50
samples is expected to take less than an hour. 

**Visualization**

Once you've received the email, go to the 'Visualization' tab, and enter the job id at the top. A PopNet graph will be loaded shortly. 
Each node represent one sample, with a chromosome painting embedded within. 
Each circle of nodes is one group, representing one subpopulation or lineage.
Drag the nodes to reposition them, or drag the dots to reposition entire groups.
Drag the background to move the view, and use the sroll wheel to zoom in/out. 

**More Information**

For a detailed guide on PopNetD3 functions, go to the Tutorial Tab. 

**Citation**

Javi Zhang, Asis Khan, Andrea Kennard, Michael E. Grigg, John Parkinson; PopNet: A Markov Clustering Approach to Study Population Genetic Structure, Molecular Biology and Evolution, Volume 34, Issue 7, 1 July 2017, Pages 1799–1811, https://doi.org/10.1093/molbev/msx110

