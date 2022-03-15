#!/bin/bash

make

# mpirun -N 4 -n 4 ./sobelf images/original/australian-flag-large.gif images/processed/australian-flag-large-sobel.gif
mpirun -N 6 -n 6 ./sobelf images/original/9815573.gif images/processed/9815573-sobel.gif
