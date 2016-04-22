/*
 * Copyright 2014 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package de.codecentric.boot.admin.server.simple;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;

import static org.springframework.web.bind.annotation.RequestMethod.*;

@RestController
public class ProxyController {
    @Autowired
    private RestTemplate restTemplate;

    @CrossOrigin(origins = "*", methods = {GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS, TRACE})
    @RequestMapping("/proxy/")
    @ResponseBody
    public String mirrorRest(@RequestBody(required = false) String body,
                             HttpMethod method, HttpServletRequest request,
                             HttpServletResponse response) throws URISyntaxException
    {
        String url = request.getHeader("forward-url");
        System.out.println("forward url: " + url);
        HttpHeaders headers = new HttpHeaders();
        if (url.endsWith("/env") && method.equals(HttpMethod.POST)) {
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        }
        URI uri = new URI(StringUtils.isEmpty(request.getQueryString()) ? url : url + "?" + request.getQueryString());

        ResponseEntity<String> responseEntity =
                restTemplate.exchange(uri, method, new HttpEntity<String>(body, headers), String.class);

        return responseEntity.getBody();
    }
}

