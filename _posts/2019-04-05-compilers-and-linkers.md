---
layout: post
title: Building an executable, compiling and linking
---

Here is a collection of my recent learnings on how a to compile c++ code and then link it together, as well as creating a library. I'm writing this mainly to consolidate my own knowledge of this subject, and have a record for the future. 

In creating an executable there are actually (at least) two steps: compiling and linking. In many cases, compiling and linking can carried out in a single step and so one can easily be fooled into thinking the _are_ the same step, but in reality one of these has been hidden from you. This can then lead to confusion when you want to try to create a library, and link that separately.

## Compiling (but not linking)
If you code is simple enough, one would be able to do the following:
```g++ -o program_name.exe simple_main.cpp ```
where `simple_main.cpp` would be a very simple program, perhaps not including any headers. In this case both compiling and linking are done in a single step.

For more complex programs, where you have to include multiple libraries, or even to create your own library which you then use you may need, or want to, perform the compilation and linking separately.

As a simple example, let's say we have three pieces of code: 
```
main.cpp
include/MyObj.h
src/MyObj.cpp
```
Note the code for these three files are included at the bottom of this page. We want to compile and link these together to produce a single executable. Note that the header file need only contain function (or class) declarations, with the definitions in the corresponding cpp file.

To compile _only_ (and not link) use `g++ -c`. We could try just including the path to the cpp file as follows:
```
g++ -c ../src/MyObj.cpp -o MyObj.o
```
But this results in an error:
```
src/MyObj.cpp:2:10: fatal error: 'MyObj.h' file not found
#include "MyObj.h"
```

We need to tell `g++` where to look for the "#include", how does the compiler know where to look for this header file? `g++ --help` reveals
 ``` -I <dir>                Add directory to include search path ```
So we need to add the directory path to the header file so it can be found by the "#include" statement
```
g++ -c src/MyObj.cpp -o MyObj.o -I include/
```

This successfully creates the `MyObj.o` file. This is the first "compilation unit", and we can create many such object files and then _link_ them together with the linker. Note that the linker itself doesn't know anything about programming languages or care about them (at least in principle), and one could link together the `.o` files compiled from different languages. 

We may also inspect the `MyObj.o` file with the `nm` command, which displays the "symbol table".  The symbol table contains several main blocks, one of these has the symbols that are defined, and another that has the symbols that are undefined, the other blocks perform various other functions, including some lookup table that allows for faster finding of these symbols. The "defined" symbols are those that correspond to function, or pieces of code that were actually defined in the `MyObj*` files, whereas "undefined" symbols could refer to functions that are defined in other pieces of code. 
In this example there are only defined symbols, and using `nm` yields:
```
$ nm MyObj.o
0000000000000000 T __ZN5MyObj3sumEv
```
which is a but cryptic, but is language independent and can be understood by the linker.  This can be decoded by passing  `-C` to `nm`:
```
$ nm -C MyObj.o
0000000000000000 T MyObj::sum()
```
and we see we have the original `sum` function. The `T` here indicates that this is a defined symbol. 

Now let's try to compile the `main.cpp` file. This uses the `MyObj` class, as well as a header from an external library, `TH1D.h`. Trying to compile main on it's own won't work:
```
$ g++ -c main.cpp -o main.o
main.cpp:4:10: fatal error: 'TH1D.h' file not found
#include "TH1D.h"
```
Again, this is because we need to tell `g++` where to find the `TH1D.h` file. Note that `g++` didn't complain about trying to find `#include "include/MyObj.h"` as the path to that file _happens_ to be `include/MyObj.h` (if we had moved `main.cpp` somewhere else, we would have had to include the `-I` flag to the `MyObj.h` as well). Normally, to get the `TH1D.h` we would simply add the `-I` with the path to the header, like this:
 ```
 g++ -c main.cpp -o main.o -I/Users/wfawcett/root/build/include
 ```
 however, this throws a bunch of errors, since `TH1D.h` is part of ROOT, and that needs some extra compilation commands. (If you are readning this and want to install ROOT, see [here](https://root.cern.ch/building-root).) These extra commands can be passed using the `root-config --cflags` command as follows:
 ``` 
 g++ -c main.cpp -o main.o `root-config --cflags`
 ```
 `root-config --cflags` actually returns the following (for me):
 ```-pthread -stdlib=libc++ -std=c++11 -m64 -I/Users/wfawcett/root/build/include```
 and we see the relevant `-I` path, as well as some other relevant flags needed for ROOT. With the above `g++` command, `main.cpp` compiles and we are left with `main.o`, which is what we wanted. `nm -C main.o` now reveals all the symbols inside the compiled file. 

## Making a program: the linker
We have now created two _compilation units_, `main.o` and `MyObj.o`, two binary files that can be understood by your computer, but we haven't yet made a program that we can actually run! To do this we need to use the _linker_. The linker command is `ld`. Naively, we might expect the following to work:
```
$ ld -o prog main.o MyObj.o
```
but, this throws a large number of warnings. Importantly, these warnings start with ```Undefined symbols for architecture x86_64:```, which means this is a linker problem (you may see this warning when you try to compile and link something at the same time). Remember that the linker doesn't know anything about c++. In our main.cpp, we used the library `#include <iostream>` , but we haven't told our code anything about where this library might be. So, let's try to add the c++ libraries. On my mac, these libraries happen to be located here `/usr/lib/libc++.dylib` (although you don't need to know the path). We can pass this library to `ld` by adding the `-lc++` flag. This is a convention for adding libraries that can work across different machines, in this specific case, the `-l` is converted into `lib`.  However, running
```ld -o prog main.o MyObj.o -lc++``` 
still isn't enough as we need the remainder of the ROOT libraries. As an aside, one could find out what these are by using `nm` to search through all libraries on your machine and then match the symbol to what symbols are missing (a good approach if you don't know what libraries you might need), but the ROOT software provides a function to tell you what these libs should be: 
```
$ root-config --libs
-L/Users/wfawcett/root/build/lib -lCore -lImt -lRIO -lNet -lHist -lGraf -lGraf3d -lGpad -lROOTVecOps -lTree -lTreePlayer -lRint -lPostscript -lMatrix -lPhysics -lMathCore -lThread -lMultiProc -lROOTDataFrame -lpthread -stdlib=libc++ -lm -ldl
``` 
This command _almost_ tells you what you need to append to your `ld` command, however the ROOT developers have been a little naughty and assumed that nobody would ever use the linker step on it's own (perhaps fair) and provided `-stdlib=libc++` which is actually something one wold pass to `g++` which would then pass `libc++` to `ld`.  What we actually want to pass is `-lc++`, which we already have. One can add all of these ROOT libraries as follows:
```
ld -o prog main.o MyObj.o -lstdc++ `root-config --libs | sed 's/.stdlib=lib.../ /g' `  -lc++
```
(where I have included `-lc++` again for clarity, included the `-lstdc++` library, and used `sed` to remove the naughty `-stdlib=lib` from the output of `root-config --libs`). This command is what _finally_ produces the output executable, `prog.exe` that can be run from the command line!
 
## Making a library
A library is a collection of compiled objects that are used together. Making a library is essentially sticking together a bunch of compiled object files into one. One  benefit of a library is a potential performance enhancement (as the ''symbol table'' is now one large table that can reference everything inside of it, and can itself be optimised). Another benefit is if you want to "ship" a bunch of code, instead of having to deal with a lot of `.o` files, you only need one library. 

There are several types of library; including static, dynamic and interface. Here we will only deal with static libraries. 

We can create a static library with the archive command, `ar` (note the similarity with the tape archive command `tar`)
```
ar -rc libwill.a MyObj.o
```
In this example, we only have _one_ object file, however we could have many! The output library `libwill.a` is similar to the original `.o` file, and can be inspected for symbols in the same way with the `nm` command:
```
$ nm -C libwill.a

libwill.a(MyObj.o):
0000000000000000 T MyObj::sum()
```
 If more object files had been included, more symbols would appear. 

Finally, to link this and produce an executable I can _almost_ do the following:
```
$ ld -o prog.exe main.o -lwill -lstdc++ `root-config --libs | sed 's/.stdlib=lib.../ /g' `  -lc++
ld: library not found for -lwill
```
However, the library `libwill.a` isn't found. We need to tell the linker where to look for this library, to do this we add the `-L` flag followed by the path to the library. In this case the library is in the current directory, so we need only add `-L.` 

Finally, we have:
```
$ ld -o prog.exe main.o -lwill -lstdc++ `root-config --libs | sed 's/.stdlib=lib.../ /g' `  -lc++  -L.
```
Which produces the executable `prog.exe`. 

## Code examples
main.cpp:
```cpp
#include <iostream>
#include "include/MyObj.h"
#include "TH1D.h"

int main(){
  MyObj obj1(5, 6);

  std::cout << "hello world!" << std::endl;
  std::cout << "sum: " << obj1.sum() << std::endl;

  TH1D* hist = new TH1D("hist", "hist", 100, 0, 100);
  std::cout << hist->GetName() << std::endl;
}
```

src/MyObj.cpp
```cpp
#include "MyObj.h"

double MyObj::sum(){
  return x+y;
}
```

include/MyObj.h
```cpp
#ifndef MYOBJ_H
#define MYOBJ_H

class MyObj{
  private:
    double x, y;

  public:
    MyObj(double xin, double yin) : x(xin), y(yin) {}
    double sum();
};

#endif // MYOBJ_H
```

