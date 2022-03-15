#!/bin/bash

make

salloc -N 4 -n 4 mpirun ./sobelf images/original/australian-flag-large.gif images/processed/australian-flag-large-sobel.gif
salloc -N 4 -n 4 mpirun ./sobelf images/original/9815573.gif images/processed/9815573-sobel.gif
salloc -N 4 -n 4 mpirun ./sobelf images/original/Produits_sous_linux.gif images/processed/Produits_sous_linux-sobel.gif
