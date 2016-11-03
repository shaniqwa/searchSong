User and Admin Guide

Project Outline
The subject of this search engine is searching song lyrics. 
Supported language is English.
This is a Browser-based retrieval system with local files. 



User interface
The user interface is very simple and easy to use. 
There is an advanced search using the following operators:

AND - Finds documents that contain all of the specified words. 
special AND play

OR - Finds documents that contain at least one of the specified words.
queen OR japan

NOT - Excludes the documents that contain the specified word.
NOT happy

JOKER *  -  Finds documents that contain part of the string and not the word as whole.
land* - returns land, landscape etc.

When searching a term, it is stemmed to its basic form to improve search. Common words are ignored if they exist is the systems Stoplist. 

Search result are displayed similar to any search engine, very intuitive to use. The search term is highlighted if it exists in the summery (song summery is defined when uploading the document and is not dynamic). When clicking the title the document is retrieved and opes in a new tab. Printing is optional without leaving the page. The upload date is also visible, and frequency of the term in the document is used for ranking. (results are sorted by frequency from high to low to improve results relevancy).



Admin panel
Admin can control the system using the admin panel. There is no need to access the database in order to perform any operations. There is some general statistics in the top of the page, displaying the number of documents in the system, number of unique words and number of index (terms). There is a help link under each operation button to help admin use the panel correctly.  


Upload new documents
Before uploading, it's very important that you make sure you are familiar with the expected document structure.
The documents are simple .txt files. Here is an example for a file with song lyrics and details:

<author>Queen</author>
<title>Bohemian Rhapsody</title>
<summery></summery>
Is this the real life?
Is this just fantasy?
Caught in a landslide,
No escape from reality.
.
.
.

The Author, Title and Summary tags are highly recommended, because they will be displayed in the search results. If you leave the Summary tag empty, an automatic summary will be created from the beginning of the song body. It is possible to upload batch - simply choose multiple files in the upload popup (by holding down the ctrl button).

When files are uploaded an alert appear on the screen. The files at this stage are only uploaded to the Source Folder and are not yet indexed and therefor they are not yet searchable!



Start Indexing
After you have uploaded some documents to the Source Folder, it's time to index those words.
If there are some files waiting in the Source Folder, the Index button will be enabled. All you have to do is click the index button and the process will begin.
At the end of the process you will get a notification, your page will refresh and you will be able to search the new documents, which are now stored in the Storage Folder.

The following diagram describes what happens in the server in the indexing process:
After indexing, documents are searchable. On the right: the server printing the final array of terms it found when uploading some files. We can see the array is sorted and duplicates are removed (same word in the different document will not be removed). When the array is ready, each term is saved as a new record to the Index Collection in the database. Each word is stemmed before it’s indexed to improve index storing and searching. 


Hide Documents
To hide documents from search results, simply check the names you want to hide and click the Hide button.
After the process is done the page will reload and you will see the hidden documents at the Show Documents list. The selected documents will have their delete flag set to true and therefor they will be ignored from search. 

Show Documents
To show documents that are now hidden from search results, simply check the names you want to show and click the Show button. The selected documents will have their delete flag set back to false and they will become searchable again.
Project Structure

Database Structure
There are tow schemas in the DB: index and document. 

The document table stores the document unique id, song author and title, a short summery to be displayed in the search results page, a link to the document (the path in this case), and a boolean flag for removal of the document. Another field is the date filed, which is set automatically to the upload time. 


The index table stores the terms we index, the document id in which this term exists and the frequency - how many times a term appears, which is used for ranking search results. This structure is identical to the table structure suggested for inverted file as disgusted is this course. Each term is referring to one document, so the same term can appear many times in different documents. This is obviously not the best solution out there, but it is faster and easier to implement and with fast technologies used in this project (described in the next section) and the small scale of data, the results are pretty nice. In the admin panel we can see how many unique words we have stored vs how many indexes we have, this gives a way to quantify the efficiency if this method. 





Technologies
Main programming language is Javascript in both server and client. We used modern web technologies to improve performance.
Server - Node.js, MongoDB
Client - HTML, CSS, Bootstrap, Angular.js, 

Sources
Book: Introduction to Information Retrieval
