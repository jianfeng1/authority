#! /bin/bash

if !(ls | grep 'node_modules');then
  npm install cnpm -g --registry=http://sz-dev-mav-001.sino.sz:8081/repository/npm-group && cnpm install
fi


echo -e "\033[32m npm run build please wait ... \033[0m"
cnpm run dll && cnpm run build


product_path="$(ls dist)"
product_name=$(basename "$PWD")
time_str=$(date "+%Y%m%d%H%M")
package_name="${product_name}-${time_str}.zip"


if [ -n "${product_path}" ];then
  echo "build in dist: ${product_path}"
  cp -r dist/${product_path} .
  zip -r ${package_name} ${product_path}
  echo -e "application-name=${product_path}\npackage-name=${package_name}\npath=$(pwd)/${package_name}" > product-info.txt
  mkdir devops_deploy
  cp product-info.txt devops_deploy
  tar cvf devops_deploy.tar devops_deploy
else
  echo "build failed"
fi



