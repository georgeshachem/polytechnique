#include <cuda.h>
#include <stdio.h>
#include <stdlib.h>

#include "cuda_runtime.h"
#include "pgdatatypes.h"


#ifdef __cplusplus
extern "C"
{
#endif
    void apply_gray_filter_gif_gpu(animated_gif *image);
    void apply_blur_filter_gif_gpu(animated_gif *image, int size, int threshold);
    void apply_sobel_filter_gif_gpu(animated_gif *image);
    void apply_all_filters_gif_gpu(animated_gif *image, int size, int threshold);
    void apply_all_filters_image_gpu(animated_gif *image, int rank, int blur_size, int threshold);

#ifdef __cplusplus
}
#endif