# TJOURNAL (TJ)

Clone [tjournal.ru](https://tjournal.ru).
A Social/Blogging network. Built in Django.

## Demo 

### Chat
![alt text](https://github.com/Apoorva-Shukla/tjournal/blob/main/.github/images/chat.gif?raw=true)

### No page reload (my own implementation) 
![alt text](https://github.com/Apoorva-Shukla/tjournal/blob/main/.github/images/update-.gif?raw=true)

### Error loading a page
 - ***Note: emulation of, when a user is offline***


![alt text](https://github.com/Apoorva-Shukla/tjournal/blob/main/.github/images/update-offline.gif?raw=true)

### 404 page (no more) 
![alt text](https://github.com/Apoorva-Shukla/tjournal/blob/main/.github/images/update-404.gif?raw=true)

## Few Screenshots

![alt text](https://github.com/Apoorva-Shukla/tjournal/blob/main/.github/images/3.png?raw=true)
![alt text](https://github.com/Apoorva-Shukla/tjournal/blob/main/.github/images/Screenshot%20(316).png?raw=true)
![alt text](https://github.com/Apoorva-Shukla/tjournal/blob/main/.github/images/Screenshot%20(317).png?raw=true)
![alt text](https://github.com/Apoorva-Shukla/tjournal/blob/main/.github/images/Screenshot%20(318).png?raw=true)
![alt text](https://github.com/Apoorva-Shukla/tjournal/blob/main/.github/images/Screenshot%20(319).png?raw=true)

## Run Yourself

Clone the project

```bash
git clone https://github.com/Apoorva-Shukla/tjournal.git
```

Go to the project directory

```bash
cd tjournal
```

Create a virtual environment

```bash
pip install -m venv .env
```

Activate virtual environment

```bash
.\.env\Scripts\activate
```

Install requirements

```bash
pip install -r requirements.txt
```

Run migrations

```bash
python manage.py migrate
python manage.py makemigrations
python manage.py migrate
```

Start the server

```bash
python manage.py runserver
```
