# olcc - OnLineCoinCoin

OnlineCoincoin est un client multi-tribune conçu pour tourner dans un navigateur, avec le moins possible de code serveur.
Quand j'aurai un peu de temps, je ferai un README un peu plus fourni.
En attendant, ceux qui savent sauront.

## Exécuter avec Docker

    docker build . -t olcc
    docker run -p 8000:80 olcc

Se connecter à http://localhost:8000/