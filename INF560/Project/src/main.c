/*
 * INF560
 *
 * Image Filtering Project
 */
#include <stdio.h>
#include <stdlib.h>
#include <sys/time.h>
#include "gif_lib.h"

#include "filters.h"
#include "cfilters.h"
#include "filters_omp.h"
#include "filters_part.h"
#include "utils.h"
#include "pgdatatypes.h"

/*
 * Main entry point
 */
int main(int argc, char **argv)
{
    /* General variables */
    int MPIMode = 2;

    char *input_filename;
    char *output_filename;
    animated_gif *image;
    struct timeval t1, t2;
    double duration;

    /* Start MPI Config */
    MPI_Init(&argc, &argv);
    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    /* Custom DataType MPI_Pixel */
    int count = 3;
    int array_of_blocklengths[] = {1, 1, 1};
    MPI_Aint array_of_displacements[] = {offsetof(pixel, r),
                                         offsetof(pixel, g),
                                         offsetof(pixel, b)};
    MPI_Datatype array_of_types[] = {MPI_INTEGER, MPI_INTEGER, MPI_INTEGER};
    MPI_Datatype tmp_type, MPI_Pixel;
    MPI_Aint lb, extent;
    MPI_Type_create_struct(count, array_of_blocklengths, array_of_displacements,
                           array_of_types, &tmp_type);
    MPI_Type_get_extent(tmp_type, &lb, &extent);
    MPI_Type_create_resized(tmp_type, lb, extent, &MPI_Pixel);
    MPI_Type_commit(&MPI_Pixel);
    /* Custom DataType MPI_Pixel */

    /* Custom DataType MPI_ImagePart */
    int count2 = 4;
    int array_of_blocklengths2[] = {1, 1, 1, 1};
    MPI_Aint array_of_displacements2[] = {offsetof(image_part, img_idx),
                                          offsetof(image_part, start),
                                          offsetof(image_part, stop),
                                          offsetof(image_part, pos)};
    MPI_Datatype array_of_types2[] = {MPI_INTEGER, MPI_INTEGER, MPI_INTEGER, MPI_INTEGER};
    MPI_Datatype tmp_type2, MPI_ImagePart;
    MPI_Aint lb2, extent2;
    MPI_Type_create_struct(count2, array_of_blocklengths2, array_of_displacements2,
                           array_of_types2, &tmp_type2);
    MPI_Type_get_extent(tmp_type2, &lb2, &extent2);
    MPI_Type_create_resized(tmp_type2, lb2, extent2, &MPI_ImagePart);
    MPI_Type_commit(&MPI_ImagePart);
    /* Custom DataType MPI_ImagePart */

    /* End MPI Config */

    /* Check command-line arguments */
    if (argc < 3)
    {
        fprintf(stderr, "Usage: %s input.gif output.gif \n", argv[0]);
        return 1;
    }

    input_filename = argv[1];
    output_filename = argv[2];

    /* Load file and store the pixels in array */
    image = load_pixels(input_filename);
    if (image == NULL)
    {
        return 1;
    }

    if (rank == 0)
    {
        /* IMPORT Timer start */
        gettimeofday(&t1, NULL);

        /* IMPORT Timer stop */
        gettimeofday(&t2, NULL);

        duration = (t2.tv_sec - t1.tv_sec) + ((t2.tv_usec - t1.tv_usec) / 1e6);

        printf("GIF loaded from file %s with %d image(s) in %lf s\n",
               input_filename, image->n_images, duration);

        /* FILTER Timer start */
        gettimeofday(&t1, NULL);

        /* Start of MPI */

        /* MPI Variables */
        MPI_Request *req;

        /* send the tasks */
        int task;
        int dest_rank;

        if (size > 2)
        {
            if (MPIMode == 1)
            {
                req = malloc(sizeof(MPI_Request) * image->n_images);
                for (task = 0; task < image->n_images; task++)
                {
                    int ready;
                    MPI_Recv(&ready, 1, MPI_INTEGER, MPI_ANY_SOURCE, 1, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
                    dest_rank = ready;
                    MPI_Irecv(image->p[task], image->height[task] * image->width[task], MPI_Pixel, dest_rank, 0, MPI_COMM_WORLD, &req[task]);
                    MPI_Send(&task, 1, MPI_INTEGER, dest_rank, 0, MPI_COMM_WORLD);
                }
            }
            else if (MPIMode == 2)
            {
                req = malloc(sizeof(MPI_Request) * (size - 1));
                int img_index;
                image_part img_part;
                int offset, start, stop;
                int ready;

                //
                pixel **p;
                p = (pixel **)malloc((size - 1) * sizeof(pixel *));
                int i;
                for (i = 0; i < (size - 1); i++)
                {
                    p[i] = (pixel *)malloc(image->width[0] * image->height[0] * sizeof(pixel));
                }
                animated_gif *output_image = (animated_gif *)malloc(sizeof(animated_gif));
                output_image->p = p;
                //

                for (img_index = 0; img_index < image->n_images; img_index++)
                {
                    // int img_size = image->width[img_index] * image->height[img_index];
                    int img_part_size = image->height[img_index] / (size - 1);
                    // printf("img_index %d - img_size %d - img_part_size %d\n", img_index, img_size, img_part_size);

                    offset = 0;
                    for (task = 0; task < (size - 1); task++)
                    {
                        start = offset * img_part_size;
                        offset++;
                        stop = offset * img_part_size;
                        if (task == size)
                        {
                            stop = image->height[img_index];
                        }
                        // printf("Image #%d from %d to %d\n", img_index, start, stop);
                        img_part.img_idx = img_index;
                        img_part.start = start;
                        img_part.stop = stop;
                        img_part.pos = offset - 1;
                        MPI_Recv(&ready, 1, MPI_INTEGER, MPI_ANY_SOURCE, 1, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
                        dest_rank = ready;
                        MPI_Irecv(output_image->p[task], image->height[img_index] * image->width[img_index], MPI_Pixel, dest_rank, 0, MPI_COMM_WORLD, &req[task]);
                        MPI_Send(&img_part, 1, MPI_ImagePart, dest_rank, 0, MPI_COMM_WORLD);
                    }
                    MPI_Waitall((size - 1), req, MPI_STATUSES_IGNORE);
                    offset = 0;
                    img_part_size = (image->height[img_index] * image->width[img_index]) / (size - 1);
                    for (task = 0; task < (size - 1); task++)
                    {
                        start = offset * img_part_size;
                        offset++;
                        stop = offset * img_part_size;
                        if (task == size)
                        {
                            stop = image->height[img_index];
                        }
                        // printf("Copying image #%d from %d to %d\n", img_index, start, stop);
                        for (i = start; i <= stop; i++)
                        {
                            image->p[img_index][i] = output_image->p[task][i];
                        }
                    }
                }
            }
        }
        else
        {
            // apply_gray_filter_gif_omp(image);
            // apply_blur_filter_gif_omp(image, 5, 20);
            // apply_sobel_filter_gif_omp(image);
            apply_all_filters_gif_gpu(image, 5, 20);
        }

        /* send a message that tell the workers to stop */
        for (dest_rank = 1; dest_rank < size; dest_rank++)
        {
            int ready;
            MPI_Recv(&ready, 1, MPI_INTEGER, dest_rank, 1, MPI_COMM_WORLD, MPI_STATUS_IGNORE);

            if (MPIMode == 1)
            {
                int stop_value = -1;
                MPI_Send(&stop_value, 1, MPI_INTEGER, dest_rank, 0, MPI_COMM_WORLD);
            }
            else
            {
                image_part stop_img_part;
                stop_img_part.img_idx = -1;
                MPI_Send(&stop_img_part, 1, MPI_ImagePart, dest_rank, 0, MPI_COMM_WORLD);
            }
        }

        if (size > 1 && MPIMode == 1)
        {
            /* wait until all the results are received */
            MPI_Waitall(image->n_images, req, MPI_STATUSES_IGNORE);
        }

        /* End of MPI */

        /* FILTER Timer stop */
        gettimeofday(&t2, NULL);

        duration = (t2.tv_sec - t1.tv_sec) + ((t2.tv_usec - t1.tv_usec) / 1e6);

        printf("SOBEL done in %lf s\n", duration);

        /* EXPORT Timer start */
        gettimeofday(&t1, NULL);

        /* Store file from array of pixels to GIF file */
        if (!store_pixels(output_filename, image))
        {
            return 1;
        }

        /* EXPORT Timer stop */
        gettimeofday(&t2, NULL);

        duration = (t2.tv_sec - t1.tv_sec) + ((t2.tv_usec - t1.tv_usec) / 1e6);

        printf("Export done in %lf s in file %s\n", duration, output_filename);
    }
    else
    {
        if (MPIMode == 1)
        {
            int img_idx;
            while (1)
            {
                MPI_Send(&rank, 1, MPI_INTEGER, 0, 1, MPI_COMM_WORLD);
                MPI_Recv(&img_idx, 1, MPI_INTEGER, 0, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
                if (img_idx == -1)
                {
                    break;
                }
                // apply_gray_filter_image(image->p[img_idx], image->width[img_idx], image->height[img_idx]);
                // apply_blur_filter_image(image->p[img_idx], 5, 20, image->width[img_idx], image->height[img_idx]);
                // apply_sobel_filter_image(image->p[img_idx], image->width[img_idx], image->height[img_idx]);
                apply_all_filters_image_gpu(image, img_idx, 5, 20);
                MPI_Send(image->p[img_idx], image->height[img_idx] * image->width[img_idx], MPI_Pixel, 0, 0, MPI_COMM_WORLD);
            }
        }
        else if (MPIMode == 2)
        {
            image_part img_part;
            while (1)
            {
                MPI_Send(&rank, 1, MPI_INTEGER, 0, 1, MPI_COMM_WORLD);
                MPI_Recv(&img_part, 1, MPI_ImagePart, 0, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
                if (img_part.img_idx == -1)
                {
                    break;
                }
                // apply_all_filters_image_gpu(image, img_part.img_idx, 5, 20);
                apply_gray_filter_gif_part(image, img_part.start - 2, img_part.stop + 2);
                apply_blur_filter_gif_part(image, 5, 20, img_part.start, img_part.stop);
                apply_sobel_filter_gif_part(image, img_part.start, img_part.stop);
                MPI_Send(image->p[img_part.img_idx], image->height[img_part.img_idx] * image->width[img_part.img_idx], MPI_Pixel, 0, 0, MPI_COMM_WORLD);
            }
        }
    }
    MPI_Finalize();
    return 0;
}
