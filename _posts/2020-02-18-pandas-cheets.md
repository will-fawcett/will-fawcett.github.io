---
layout: post
title: Basic pandas operations
---

I keep forgetting how to do some basic operations with pandas


# Row manipulation

## Deleting (based on column conditions)

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


# Column manipulation 
some text
