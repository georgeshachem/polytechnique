#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include "pgdatatypes.h"
#include <mpi.h>

void apply_gray_filter_image_part(pixel *p, int width, int height, int start, int stop);
void apply_gray_filter_gif_part(animated_gif *image, int start, int stop);

void apply_blur_filter_image_part(pixel *p, int size, int threshold, int width, int height, int start, int stop);
void apply_blur_filter_gif_part(animated_gif *image, int size, int threshold, int start, int stop);

void apply_sobel_filter_image_part(pixel *p, int width, int height, int start, int stop);
void apply_sobel_filter_gif_part(animated_gif *image, int start, int stop);