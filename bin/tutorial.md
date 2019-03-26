#####PopNetD3 Tutorial
----------------

**Prerequisites**  

Data Format: Currently, we only accept tabular SNP data as input. An example can be viewed [here](./bin/SNPTable.txt). The requirements are:

  1. Elements in a row are separated by tabs (the \\t character).
  2. The header row begin with '#CHROM', followed by 'POS', followed by a list of sample names. The sample names should be short, and consist only of alphanumeric characters (A-Z, 0-9)
  3. If a reference genome is specified in the submission form, it should be the first sample (the third column). 
  4. Each data row should contain the chromosome, base pair position, and a list of genotypes corresponding to each sample in the header row. The chromosome name must be in the format of '[ID]_CHR[I-XX]'. The ID can be anything, and I-XX refers to any roman numeral. 
  5. Any character is allowed in the SNP data. Matching characters (ex. A, T, C, G, or N) are considered to have shared genotype at that position by PopNet. Missing data, if unavoidable, should be denoted with '-'. This will cause the corresponding block on the results to be grayed out. 

Browser: This application is best suited for Google Chrome. Other browsers may experience problems.

---------------

**Job Submission**  

The 'Submit Job' tab can be used to submit jobs to be run on our server. Currently this is the only way to access PopNetD3. All fields in the form should be filled out. 

![Job Submission Page](./bin/submission.png)

  1. Input Format: Currently, leave this as the default.
  2. Reference Sample: The name of the reference sample used to call the SNPs. Should also be the first sample in the data.
  3. I Value: This value affects the groups formed by PopNet. Put 0 to use an auto-generated value.*
  4. pI Value: Related to the I Value. Put 0 to use an auto-generated value.
  5. Section Length: Controls how long each section in the chromosome painting is. This value should be related to the organism's genome size. For larger genomes (>20Mb), we recommend 10,000. For smaller genomes (<5Mb) we recommend 5,000. For intermediate genomes, we recommend 8000. 
  6. Email Address: Please submit an email address so we can send you a notification when the job is done, the job id, as well as additional diagnostic data. It won't be possible to retrieve the results of a job if no email address was provided.
  7. Attach File: Select the file to be uploaded here. 

  ------------

**Network Viewer**

This is where you can view, manipulate, and save the results of your job as a PDF. 

![Network Viewer Page](./bin/chr.png)

  1. Enter the unique ID provided in your email into the Job ID field, and click the arrow to retrieve your job.
  2. Each node represents one sample, and can be dragged to rearrange the network. The mouse wheel can be used to zoom into network.
  
    A Chromosome painting is embedded into each node. If there are more than one chromosomes in the genomes, individual chromosomes on each painting can be clicked for an expanded view on that particular chromosome.

    In the expanded view, nodes can be selected for chromosome alignment. See Chromosome Alignment.  
  3. Groups, representing subpopulations, are organized in a circle around 'group nodes', which appear as a solid dot. All nodes within a group can be dragged simultaneously via the group node. 
  4. Save: Saves the current view as a PDF. Saves only what's on the screen.  
  5. Reset: Resets the nodes to their initial positions.  
  6. Chromosome Alignment: Opens the chromosome alignment window (A), showing an aligned view of the current chromosome for all selected nodes. Nodes can be selected from the network viewer by clicking on the node. A selected node will be colored yellow. Note that if there are more than one chromosomes, a node can only be selected after the view has been expanded to a single chromosome.   
  7. Select Chromosome: Select a chromosome by number. Behaves similarly to clicking on a chromosome in the network view. 
  8. Select Edge Cutoff: Edges with similarity value below the selected cutoff will not be displayed.

 



