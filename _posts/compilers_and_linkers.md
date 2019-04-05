Here is a collection of my recent learnings on how a to compile c++ code and then link it together.
I'm writing this mainly to consolidate my own knowledge of this subject, and have a record for the future. 

In creating an executable there are actually (at least) two steps, compiling and linking. 
In many cases, compiling and linking can carried out in a single step and so one can easily be fooled into thinking the _are_ the same step, but in reality one of these has been hidden from you. 

If you code is simple enough, one would be able to do the following:
g++ -o program_name.exe simple_main.cpp 
where simple_main.cpp would be a very simple program, perhaps not including any headers. In this case both compiling and linking are done in a single step.

For more complex programs, where you have to include multiple libraries, or even to create your own library which you then use you may need, or want to, perform the compilation and linking separately.

As a simple example, let's say we have three pieces of code:
main.cpp
include/MyObj.h
src/MyObj.cpp

We want to compile and link these together to produce a single executable. 
Note that the header file need only contain function (or class) declarations, with the definitions in the corresponding cpp file.

To compile _only_ use "g++ -c", we could try just including the path to the cpp file as follows:
g++ -c ../src/MyObj.cpp -o MyObj.o
But this results in an error, 
src/MyObj.cpp:2:10: fatal error: 'MyObj.h' file not found
#include "MyObj.h"

We need to tell g++ where to look for the "include", g++ --help reveals
  -I <dir>                Add directory to include search path
So we need to add the directory path to the header file so it can be found by the "include" statement
g++ -c src/MyObj.cpp -o MyObj.o -I include/

This successfully creates the "MyObj.o" file. 
This is the first "compilation unit", and we can create many such object files and then _link_ them together with the linker. 
Note that the linker itself doesn't know anything about programming languages or care about them (at least in principle), and one could link together the ".o" files compiled from different languages.
We can now also inspect the MyObj.o file with the "nm" command, which displays the "symbol table". 
The symbol table contains several main blocks, one of these has the symbols that are defined, and another that has the symbols that are undefined, the other blocks may contain some lookup table that allows for faster finding of these symbols.
The "defined" symbols are those that correspond to function, or pieces of code that were actually defined in the MyObj* files, whereas undefined symbols could refer to functions that are defined in other pieces of code. 
In this example there are only defined symbols, and using "nm" yields:
$ nm  MyObj.o
0000000000000000 T __ZN5MyObj3sumEv





