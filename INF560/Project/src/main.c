/*
 * INF560
 *
 * Image Filtering Project
 */
#include <stdio.h>
#include <stdlib.h>
#include <sys/time.h>

#include "gif_lib.h"
#include "filters.c"

#include <mpi.h>

/*
 * Main entry point
 */
int main(int argc, char **argv)
{
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
        MPI_Request *req = malloc(sizeof(MPI_Request) * image->n_images);

        /* send the tasks */
        int task;
        int dest_rank;

        for (task = 0; task < image->n_images; task++)
        {
            int ready;
            MPI_Recv(&ready, 1, MPI_INTEGER, MPI_ANY_SOURCE, 1, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
            dest_rank = ready;
            MPI_Irecv(image->p[task], image->height[task] * image->width[task], MPI_Pixel, dest_rank, 0, MPI_COMM_WORLD, &req[task]);
            MPI_Send(&task, 1, MPI_INTEGER, dest_rank, 0, MPI_COMM_WORLD);
        }

        /* send a message that tell the workers to stop */
        for (dest_rank = 1; dest_rank < size; dest_rank++)
        {
            int ready;
            MPI_Recv(&ready, 1, MPI_INTEGER, dest_rank, 1, MPI_COMM_WORLD, MPI_STATUS_IGNORE);

            int stop_value = -1;
            MPI_Send(&stop_value, 1, MPI_INTEGER, dest_rank, 0, MPI_COMM_WORLD);
        }

        /* wait until all the results are received */
        MPI_Waitall(image->n_images, req, MPI_STATUSES_IGNORE);

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
        int img_idx;
        while (1)
        {
            MPI_Send(&rank, 1, MPI_INTEGER, 0, 1, MPI_COMM_WORLD);
            MPI_Recv(&img_idx, 1, MPI_INTEGER, 0, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
            if (img_idx == -1)
            {
                break;
            }
            apply_gray_filter_image(image->p[img_idx], image->width[img_idx], image->height[img_idx]);
            apply_blur_filter_image(image->p[img_idx], 5, 20, image->width[img_idx], image->height[img_idx]);
            apply_sobel_filter_image(image->p[img_idx], image->width[img_idx], image->height[img_idx]);
            MPI_Send(image->p[img_idx], image->height[img_idx] * image->width[img_idx], MPI_Pixel, 0, 0, MPI_COMM_WORLD);
        }
    }
    MPI_Finalize();
    return 0;
}
