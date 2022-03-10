SRC_DIR=src
HEADER_DIR=include
OBJ_DIR=obj

MPI_INSTALL=/users/profs/2016/patrick.carribault/local/openmpi
MPI_INCS=$(MPI_INSTALL)/include
MPI_LIB=$(MPI_INSTALL)/lib64
CUDA_LIB=/usr/local/cuda/lib64

CC=mpicc
NVCC=nvcc
CFLAGS=-O3 -I$(HEADER_DIR) -fopenmp
LDFLAGS=-lm -lcudart -L$(CUDA_LIB)
NVCFLAGS=-I$(MPI_INCS) -I$(HEADER_DIR)

SRC= dgif_lib.c \
	egif_lib.c \
	gif_err.c \
	gif_font.c \
	gif_hash.c \
	gifalloc.c \
	main.c \
	openbsd-reallocarray.c \
	quantize.c \
	filters.c \
	utils.c \
	cfilters.cu


OBJ= $(OBJ_DIR)/dgif_lib.o \
	$(OBJ_DIR)/egif_lib.o \
	$(OBJ_DIR)/gif_err.o \
	$(OBJ_DIR)/gif_font.o \
	$(OBJ_DIR)/gif_hash.o \
	$(OBJ_DIR)/gifalloc.o \
	$(OBJ_DIR)/main.o \
	$(OBJ_DIR)/openbsd-reallocarray.o \
	$(OBJ_DIR)/quantize.o \
	$(OBJ_DIR)/filters.o \
	$(OBJ_DIR)/utils.o \
	$(OBJ_DIR)/cfilters.o

all: $(OBJ_DIR) sobelf

$(OBJ_DIR):
	mkdir $(OBJ_DIR)

$(OBJ_DIR)/%.o : $(SRC_DIR)/%.c
	$(CC) $(CFLAGS) -c -o $@ $^

$(OBJ_DIR)/%.o : $(SRC_DIR)/%.cu
	$(NVCC) $(NVCFLAGS) $(LDFLAGS) -c -o $@ $^

sobelf:$(OBJ)
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

clean:
	rm -f sobelf $(OBJ)

count:
	ls images/processed/ | wc -l

run:
	make clean
	./clean_test.sh
	clear
	./run_test.sh

mpi:
	make clean
	./clean_test.sh
	clear
	./run_test_mpi.sh

omp:
	make clean
	./clean_test.sh
	clear
	./run_test_omp.sh

hybrid:
	make clean
	./clean_test.sh
	clear
	./run_test_hybrid.sh

cuda:
	make clean
	./clean_test.sh
	clear
	./run_test_cuda.sh

cudafix:
	export CPATH=$CPATH:/usr/local/cuda/include
	export LIBRARY_PATH=$LIBRARY_PATH:/usr/local/cuda/lib64

fullclean:
	make clean
	./clean_test.sh
	clear