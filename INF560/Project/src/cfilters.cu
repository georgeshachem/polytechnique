#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

#include <cfilters.h>

#define CONV(l, c, nb_c) \
    (l) * (nb_c) + (c)

__global__ void apply_gray_filter_image_gpu_kernel(pixel *p, int width, int height)
{
    int j = threadIdx.x + blockIdx.x * blockDim.x;

    if (j < width * height)
    {
        int moy;

        moy = (p[j].r + p[j].g + p[j].b) / 3;
        if (moy < 0)
            moy = 0;
        if (moy > 255)
            moy = 255;

        p[j].r = moy;
        p[j].g = moy;
        p[j].b = moy;
    }
}

__global__ void apply_blur_filter_image_gpu_kernel(pixel *p, pixel *p_new, int *end,
                                            int width, int height, int size, int threshold)
{
    int position = threadIdx.x + blockIdx.x * blockDim.x;
    int j = position / width;
    int k = position % width;

    if (k == 0 && j == 0)
    {
        *end = 1;
    }

    if (k >= size && k < width - size)
    {

        if (j >= size && j < height / 10 - size || j >= height * 0.9 + size && j < height - size)
        {
            int stencil_j, stencil_k;
            int t_r = 0;
            int t_g = 0;
            int t_b = 0;

            for (stencil_j = -size; stencil_j <= size; stencil_j++)
            {
                for (stencil_k = -size; stencil_k <= size; stencil_k++)
                {
                    t_r += p[CONV(j + stencil_j, k + stencil_k, width)].r;
                    t_g += p[CONV(j + stencil_j, k + stencil_k, width)].g;
                    t_b += p[CONV(j + stencil_j, k + stencil_k, width)].b;
                }
            }

            p_new[CONV(j, k, width)].r = t_r / ((2 * size + 1) * (2 * size + 1));
            p_new[CONV(j, k, width)].g = t_g / ((2 * size + 1) * (2 * size + 1));
            p_new[CONV(j, k, width)].b = t_b / ((2 * size + 1) * (2 * size + 1));
        }

        if (j >= height / 10 - size && j < height * 0.9 + size)
        {
            p_new[CONV(j, k, width)].r = p[CONV(j, k, width)].r;
            p_new[CONV(j, k, width)].g = p[CONV(j, k, width)].g;
            p_new[CONV(j, k, width)].b = p[CONV(j, k, width)].b;
        }
    }

    __threadfence();

    if (j >= 1 && j < height - 1 && k >= 1 && k < width - 1)
    {
        float diff_r;
        float diff_g;
        float diff_b;

        diff_r = (p_new[CONV(j, k, width)].r - p[CONV(j, k, width)].r);
        diff_g = (p_new[CONV(j, k, width)].g - p[CONV(j, k, width)].g);
        diff_b = (p_new[CONV(j, k, width)].b - p[CONV(j, k, width)].b);

        if (diff_r > threshold || -diff_r > threshold ||
            diff_g > threshold || -diff_g > threshold ||
            diff_b > threshold || -diff_b > threshold)
        {
            *end = 0;
        }
    }

    __threadfence();

    if (j >= 1 && j < height - 1 && k >= 1 && k < width - 1)
    {
        p[CONV(j, k, width)].r = p_new[CONV(j, k, width)].r;
        p[CONV(j, k, width)].g = p_new[CONV(j, k, width)].g;
        p[CONV(j, k, width)].b = p_new[CONV(j, k, width)].b;
    }
}

__global__ void apply_sobel_filter_image_gpu_kernel(pixel *p, pixel *p_new, int width, int height)
{
    int position = threadIdx.x + blockIdx.x * blockDim.x;
    int j = position / width;
    int k = position % width;

    if (j >= 1 && j < height - 1 && k >= 1 && k < width - 1)
    {
        int pixel_blue_no, pixel_blue_n, pixel_blue_ne;
        int pixel_blue_so, pixel_blue_s, pixel_blue_se;
        // int pixel_blue_o , pixel_blue  , pixel_blue_e ;
        int pixel_blue_o, pixel_blue_e;

        float deltaX_blue;
        float deltaY_blue;
        float val_blue;

        pixel_blue_no = p[CONV(j - 1, k - 1, width)].b;
        pixel_blue_n = p[CONV(j - 1, k, width)].b;
        pixel_blue_ne = p[CONV(j - 1, k + 1, width)].b;
        pixel_blue_so = p[CONV(j + 1, k - 1, width)].b;
        pixel_blue_s = p[CONV(j + 1, k, width)].b;
        pixel_blue_se = p[CONV(j + 1, k + 1, width)].b;
        pixel_blue_o = p[CONV(j, k - 1, width)].b;
        // pixel_blue = p[CONV(j, k - 1, width)].b;
        pixel_blue_e = p[CONV(j, k + 1, width)].b;

        deltaX_blue = -pixel_blue_no + pixel_blue_ne - 2 * pixel_blue_o + 2 * pixel_blue_e - pixel_blue_so + pixel_blue_se;

        deltaY_blue = pixel_blue_se + 2 * pixel_blue_s + pixel_blue_so - pixel_blue_ne - 2 * pixel_blue_n - pixel_blue_no;

        val_blue = sqrt(deltaX_blue * deltaX_blue + deltaY_blue * deltaY_blue) / 4;

        if (val_blue > 50)
        {
            p_new[CONV(j, k, width)].r = 255;
            p_new[CONV(j, k, width)].g = 255;
            p_new[CONV(j, k, width)].b = 255;
        }
        else
        {
            p_new[CONV(j, k, width)].r = 0;
            p_new[CONV(j, k, width)].g = 0;
            p_new[CONV(j, k, width)].b = 0;
        }
    }

    else
    {
        if (j < height && k < width)
        {
            p_new[CONV(j, k, width)] = p[CONV(j, k, width)];
        }
    }
}

extern "C"
{
    void apply_gray_filter_gif_gpu(animated_gif *image)
    {
        int i;
        int width = image->width[0];
        int height = image->height[0];
        int first_image_size = width * height;

        cudaDeviceProp deviceProp;
        cudaGetDeviceProperties(&deviceProp, 0);

        pixel *output_image;
        cudaMalloc(&output_image, first_image_size * sizeof(pixel));
        dim3 dimGrid(first_image_size / deviceProp.maxThreadsPerBlock + 1);
        dim3 dimBlock(deviceProp.maxThreadsPerBlock);

        for (i = 0; i < image->n_images; i++)
        {
            cudaMemcpy(output_image, image->p[i], first_image_size * sizeof(pixel), cudaMemcpyHostToDevice);
            apply_gray_filter_image_gpu_kernel<<<dimGrid, dimBlock>>>(output_image, width, height);
            cudaMemcpy(image->p[i], output_image, first_image_size * sizeof(pixel), cudaMemcpyDeviceToHost);
        }

        cudaFree(output_image);
    }

    void apply_blur_filter_gif_gpu(animated_gif *image, int blur_size, int threshold)
    {
        int i;
        int width = image->width[0];
        int height = image->height[0];
        int end = 0;
        int first_image_size = width * height;

        int *end_device;

        cudaDeviceProp deviceProp;
        cudaGetDeviceProperties(&deviceProp, 0);

        pixel *temp_image, *output_image;
        cudaMalloc(&temp_image, first_image_size * sizeof(pixel));
        cudaMalloc(&output_image, first_image_size * sizeof(pixel));
        cudaMalloc(&end_device, sizeof(int));

        dim3 dimGrid(first_image_size / deviceProp.maxThreadsPerBlock + 1);
        dim3 dimBlock(deviceProp.maxThreadsPerBlock);

        for (i = 0; i < image->n_images; i++)
        {
            cudaMemcpy(temp_image, image->p[i], first_image_size * sizeof(pixel), cudaMemcpyHostToDevice);
            int n_iter = 0;
            end = 1;
            do
            {
                n_iter++;
                apply_blur_filter_image_gpu_kernel<<<dimGrid, dimBlock>>>(temp_image, output_image, end_device, width, height, blur_size, threshold);
                cudaMemcpy(&end, end_device, sizeof(int), cudaMemcpyDeviceToHost);
            } while (threshold > 0 && !end);
            cudaMemcpy(image->p[i], output_image, first_image_size * sizeof(pixel), cudaMemcpyDeviceToHost);
        }

        cudaFree(temp_image);
        cudaFree(output_image);
        cudaFree(end_device);
    }

    void apply_sobel_filter_gif_gpu(animated_gif *image)
    {
        int i;
        int width = image->width[0];
        int height = image->height[0];
        int first_image_size = width * height;

        cudaDeviceProp deviceProp;
        cudaGetDeviceProperties(&deviceProp, 0);

        pixel *temp_image, *output_image;
        cudaMalloc(&temp_image, first_image_size * sizeof(pixel));
        cudaMalloc(&output_image, first_image_size * sizeof(pixel));

        dim3 dimGrid(first_image_size / deviceProp.maxThreadsPerBlock + 1);
        dim3 dimBlock(deviceProp.maxThreadsPerBlock);

        for (i = 0; i < image->n_images; i++)
        {
            cudaMemcpy(temp_image, image->p[i], first_image_size * sizeof(pixel), cudaMemcpyHostToDevice);
            apply_sobel_filter_image_gpu_kernel<<<dimGrid, dimBlock>>>(temp_image, output_image, width, height);
            cudaMemcpy(image->p[i], output_image, first_image_size * sizeof(pixel), cudaMemcpyDeviceToHost);
        }

        cudaFree(temp_image);
        cudaFree(output_image);
    }
}

void apply_all_filters_gif_gpu(animated_gif *image, int blur_size, int threshold)
{
    int i;
    int width = image->width[0];
    int height = image->height[0];
    int end = 0;
    int first_image_size = width * height;

    int *end_device;

    cudaDeviceProp deviceProp;
    cudaGetDeviceProperties(&deviceProp, 0);

    dim3 dimGrid(10 * first_image_size / deviceProp.maxThreadsPerBlock + 1);
    dim3 dimBlock(deviceProp.maxThreadsPerBlock / 10);

    pixel *temp_image, *output_image;
    cudaMalloc(&temp_image, first_image_size * sizeof(pixel));
    cudaMalloc(&output_image, first_image_size * sizeof(pixel));
    cudaMalloc(&end_device, sizeof(int));

    for (i = 0; i < image->n_images; i++)
    {
        cudaMemcpy(temp_image, image->p[i], first_image_size * sizeof(pixel), cudaMemcpyHostToDevice);
        apply_gray_filter_image_gpu_kernel<<<dimGrid, dimBlock>>>(temp_image, width, height);
        int n_iter = 0;
        end = 1;
        do
        {
            n_iter++;
            apply_blur_filter_image_gpu_kernel<<<dimGrid, dimBlock>>>(temp_image, output_image, end_device, width, height, blur_size, threshold);
            cudaMemcpy(&end, end_device, sizeof(int), cudaMemcpyDeviceToHost);
        } while (threshold > 0 && !end);
        apply_sobel_filter_image_gpu_kernel<<<dimGrid, dimBlock>>>(temp_image, output_image, width, height);
        cudaMemcpy(image->p[i], output_image, first_image_size * sizeof(pixel), cudaMemcpyDeviceToHost);
    }

    cudaFree(temp_image);
    cudaFree(output_image);
    cudaFree(end_device);
}

void apply_all_filters_image_gpu(animated_gif *image, int rank, int blur_size, int threshold)
{
    int width = image->width[rank];
    int height = image->height[rank];
    int end = 0;
    int first_image_size = width * height;

    int *end_device;

    cudaDeviceProp deviceProp;
    cudaGetDeviceProperties(&deviceProp, 0);

    dim3 dimGrid(10 * first_image_size / deviceProp.maxThreadsPerBlock + 1);
    dim3 dimBlock(deviceProp.maxThreadsPerBlock / 10);

    pixel *temp_image, *output_image;
    cudaMalloc(&temp_image, first_image_size * sizeof(pixel));
    cudaMalloc(&output_image, first_image_size * sizeof(pixel));
    cudaMalloc(&end_device, sizeof(int));

    cudaMemcpy(temp_image, image->p[rank], first_image_size * sizeof(pixel), cudaMemcpyHostToDevice);
    apply_gray_filter_image_gpu_kernel<<<dimGrid, dimBlock>>>(temp_image, width, height);
    int n_iter = 0;
    end = 1;
    do
    {
        n_iter++;
        apply_blur_filter_image_gpu_kernel<<<dimGrid, dimBlock>>>(temp_image, output_image, end_device, width, height, blur_size, threshold);
        cudaMemcpy(&end, end_device, sizeof(int), cudaMemcpyDeviceToHost);
    } while (threshold > 0 && !end);
    apply_sobel_filter_image_gpu_kernel<<<dimGrid, dimBlock>>>(temp_image, output_image, width, height);
    cudaMemcpy(image->p[rank], output_image, first_image_size * sizeof(pixel), cudaMemcpyDeviceToHost);

    cudaFree(temp_image);
    cudaFree(output_image);
    cudaFree(end_device);
}