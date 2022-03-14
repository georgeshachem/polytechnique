#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include "pgdatatypes.h"
#include <mpi.h>
#include <omp.h>

void apply_gray_filter_gif_omp( animated_gif * image );
void apply_blur_filter_gif_omp( animated_gif * image, int size, int threshold );
void apply_sobel_filter_gif_omp( animated_gif * image );
