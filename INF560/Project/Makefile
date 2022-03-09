SRC_DIR=src
HEADER_DIR=include
OBJ_DIR=obj

# CC=gcc
CC=mpicc
CFLAGS=-O3 -I$(HEADER_DIR) -fopenmp
LDFLAGS=-lm

SRC= dgif_lib.c \
	egif_lib.c \
	gif_err.c \
	gif_font.c \
	gif_hash.c \
	gifalloc.c \
	main.c \
	openbsd-reallocarray.c \
	quantize.c

OBJ= $(OBJ_DIR)/dgif_lib.o \
	$(OBJ_DIR)/egif_lib.o \
	$(OBJ_DIR)/gif_err.o \
	$(OBJ_DIR)/gif_font.o \
	$(OBJ_DIR)/gif_hash.o \
	$(OBJ_DIR)/gifalloc.o \
	$(OBJ_DIR)/main.o \
	$(OBJ_DIR)/openbsd-reallocarray.o \
	$(OBJ_DIR)/quantize.o

all: $(OBJ_DIR) sobelf

$(OBJ_DIR):
	mkdir $(OBJ_DIR)

$(OBJ_DIR)/%.o : $(SRC_DIR)/%.c
	$(CC) $(CFLAGS) -c -o $@ $^

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

fullclean:
	make clean
	./clean_test.sh
	clear