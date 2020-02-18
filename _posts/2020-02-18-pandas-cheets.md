---
layout: post
title: Basic pandas operations
---

I keep forgetting how to do some basic operations with pandas


## Row manipulation

Delete rows based on condition on a column

indexNames = dfObj[ dfObj['Age'] == 30 ].index

# Delete these row indexes from dataFrame
dfObj.drop(indexNames , inplace=True)


## Column manipulation 
