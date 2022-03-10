#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include "pgdatatypes.h"
#include <mpi.h>
#include <omp.h>

void apply_gray_filter_image(pixel *p, int width, int height);
void apply_gray_filter_gif(animated_gif *image);
void apply_gray_line(animated_gif *image);

void apply_blur_filter_image(pixel *p, int size, int threshold, int width, int height);
void apply_blur_filter_gif(animated_gif *image, int size, int threshold);

void apply_sobel_filter_image(pixel *p, int width, int height);
void apply_sobel_filter_gif(animated_gif *image);