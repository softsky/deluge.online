# [ec2-user@ip-172-31-29-237 ~]$ sudo iptables -I INPUT -p tcp --dport 80 -i eth0 -m state --state NEW -m recent --set
# [ec2-user@ip-172-31-29-237 ~]$ sudo iptables -I INPUT -p tcp --dport 80 -i eth0 -m state --state NEW -m recent --update --seconds 60 --hitcount 5 -j DROP

# https://serverfault.com/questions/419784/how-to-automatically-and-temporarily-block-an-ip-address-making-too-many-hits-on

FROM node:latest

ADD ./dist /opt/deluge.online
ADD templates /opt/deluge.online/
ADD package.json /opt/deluge.online
ADD ./.env /opt/deluge.online
WORKDIR /opt/deluge.online
RUN yarn
ENTRYPOINT node index.js
