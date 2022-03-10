#include <stdio.h>
#include <stdlib.h>
#include <sys/time.h>
#include "gif_lib.h"
#include "pgdatatypes.h"

animated_gif *
load_pixels(char *filename);

int output_modified_read_gif(char *filename, GifFileType *g);

int store_pixels(char *filename, animated_gif *image);