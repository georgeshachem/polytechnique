#ifndef PGDATATYPES
#define PGDATATYPES

#include "gif_lib.h"

/* Represent one pixel from the image */
typedef struct pixel
{
    int r; /* Red */
    int g; /* Green */
    int b; /* Blue */
} pixel;

/* Represent one GIF image (animated or not */
typedef struct animated_gif
{
    int n_images;   /* Number of images */
    int *width;     /* Width of each image */
    int *height;    /* Height of each image */
    pixel **p;      /* Pixels of each image */
    GifFileType *g; /* Internal representation.
                         DO NOT MODIFY */
} animated_gif;

typedef struct image_part
{
    int img_idx;
    int start;
    int stop;
    int pos;
} image_part;

#endif