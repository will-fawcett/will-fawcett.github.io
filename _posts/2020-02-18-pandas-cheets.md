---
layout: post
title: Basic pandas operations
---

I keep forgetting how to do some basic operations with pandas


# Row manipulation

## Deleting rows (based on column conditions)

Condition on a single column 
```
indexNames = df[ df['Age'] == 30 ].index
df.drop(indexNames , inplace=True)
``

Delete rows based on multiple conditions on a single column
```
indexNames = df[ (df['Age'] >= 30) & (df['Age'] <= 40) ].index
df.drop(indexNames , inplace=True)
```

Delete rows based on multiple conditions on different columns
```
indexNames = df[ (df['Age'] >= 30) & (df['Country'] == 'India') ].index
df.drop(indexNames , inplace=True)
```

## Selecting rows (based on column conditions)

https://stackoverflow.com/questions/17071871/how-to-select-rows-from-a-dataframe-based-on-column-values
To select rows whose column value equals a scalar, some_value, use ==:

df.loc[df['column_name'] == some_value]
To select rows whose column value is in an iterable, some_values, use isin:

df.loc[df['column_name'].isin(some_values)]
Combine multiple conditions with &:

df.loc[(df['column_name'] >= A) & (df['column_name'] <= B)]
Note the parentheses. Due to Python's operator precedence rules, & binds more tightly than <= and >=. Thus, the parentheses in the last example are necessary. Without the parentheses

df['column_name'] >= A & df['column_name'] <= B
is parsed as

df['column_name'] >= (A & df['column_name']) <= B
which results in a Truth value of a Series is ambiguous error.

To select rows whose column value does not equal some_value, use !=:

df.loc[df['column_name'] != some_value]
isin returns a boolean Series, so to select rows whose value is not in some_values, negate the boolean Series using ~:

df.loc[~df['column_name'].isin(some_values)]




# Column manipulation 
some text
