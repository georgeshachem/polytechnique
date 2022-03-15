#!/bin/bash

make

INPUT_DIR=images/original
OUTPUT_DIR=images/processed
mkdir $OUTPUT_DIR 2>/dev/null

export OMP_NUM_THREADS=6
cuda=1
node_number=1
process_number=1

if [ $OMP_NUM_THREADS -le 0 ] || [ $node_number -le 0 ] || [ $process_number -le 0 ] 
then
    echo "Error: The value provided can't be 0!"
    exit -1
fi

for i in $INPUT_DIR/*gif ; do
    DEST=$OUTPUT_DIR/`basename $i .gif`-sobel.gif
    echo "Running test on $i -> $DEST"

    if [ $OMP_NUM_THREADS -gt 1 ]
    then
        salloc -n 1 ./sobelf $i $DEST $cuda $OMP_NUM_THREADS
    else
        salloc -N $node_number -n $process_number mpirun ./sobelf $i $DEST $cuda $OMP_NUM_THREADS
    fi
done