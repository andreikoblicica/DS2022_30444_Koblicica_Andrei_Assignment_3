package ro.tuc.ds2020.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import ro.tuc.ds2020.dtos.ChatMessageDTO;
import ro.tuc.ds2020.dtos.StatusDTO;
import ro.tuc.ds2020.dtos.WebSocketMessageDTO;

import static ro.tuc.ds2020.UrlMapping.SEND;
import static ro.tuc.ds2020.UrlMapping.STATUS;

@RequestMapping
@Controller
public class MessageController {

    @Autowired
    SimpMessagingTemplate simpMessagingTemplate;

        @CrossOrigin
        @PostMapping(SEND)
        public ResponseEntity<Void> sendMessage(@RequestBody ChatMessageDTO chatMessageDTO) {
            simpMessagingTemplate.convertAndSend("/topic/messages/"+chatMessageDTO.getDestinationUserId(), chatMessageDTO);
            return new ResponseEntity<>(HttpStatus.OK);
        }

    @CrossOrigin
    @PostMapping(STATUS)
    public ResponseEntity<Void> sendStatus(@RequestBody StatusDTO statusDTO) {
        simpMessagingTemplate.convertAndSend("/topic/status/"+statusDTO.getDestinationUserId(), statusDTO);
        return new ResponseEntity<>(HttpStatus.OK);
    }


}
