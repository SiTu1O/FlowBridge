import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from '@angular/http';
import * as Modeler from 'bpmn-js/lib/Modeler.js';
import * as propertiesPanelModule from 'bpmn-js-properties-panel';
import * as propertiesProviderModule from 'bpmn-js-properties-panel/lib/provider/bpmn';
import { ProcessStorage } from 'app/data-store/data-store';

import { PaletteProvider } from './palette';
import { CustomPropertiesProvider } from './props-provider';



const fs = require('fs');
const async = require('async');

const customPaletteModule = {
  paletteProvider: ['type', PaletteProvider]
};

const customPropertiesProviderModule = {
  __init__: ['propertiesProvider'],
  propertiesProvider: ['type', CustomPropertiesProvider]
};

@Component({
  selector: 'modeler',
  styleUrls: ['./modeler.component.css'],
  templateUrl: './modeler.component.html'
})

export class ModelerComponent implements OnInit {
  modeler: any;

  modelText: string;

  goTo: boolean;

  constructor(private router: Router, private processStorage: ProcessStorage) { }

  ngOnInit() {
    this.processStorage.resetModel();
    this.modeler = new Modeler({
      container: '#canvas',
      additionalModules: [
        propertiesPanelModule,
        propertiesProviderModule,
        customPropertiesProviderModule,
        customPaletteModule
      ],
      propertiesPanel: {
        parent: '#js-properties-panel'
      }
    });
    this.modeler.importXML(this.processStorage.model, (error, definitions) => {
      if (error) {
        // console.error(err)
      } else {
        // 这里是成功之后的回调, 可以在这里做一系列事情
        this.addModelerListener()
        this.addEventBusListener()
      }
    });
  }

  openFile(event) {
    const input = event.target;
    for (let index = 0; index < input.files.length; index++) {
      const reader = new FileReader();
      reader.onload = () => {
        this.processStorage.model = reader.result;
        this.modeler.importXML(this.processStorage.model, (error, definitions) => {
        });
      };
      reader.readAsText(input.files[index]);
    }
  }

  validateName() {
    this.modeler.saveXML({ format: true },
      (err: any, xml: string) => {
        console.log(xml);
        if (this.processStorage.hasModel(this.modeler.definitions.rootElements[0].id)) {
          this.modelText = 'The selected ID exists on the Workspace. Please, change this value and try again.';
          this.goTo = false;
        } else if (!this.modeler.definitions.rootElements[0].name || this.modeler.definitions.rootElements[0].name === '') {
          this.modelText = 'The Name of the model cannot be empty. Please, update this value and try again.';
          this.goTo = false;
        } else {
          this.goTo = true;
          this.processStorage.modelId = this.modeler.definitions.rootElements[0].id;
          this.processStorage.registerModel(xml);
          this.modelText = 'Working in Model Registration. Please, take into account that this may require some seconds.';
        }
      }
    );
  }

  goToDashborad() {
    if (this.goTo) {
      this.goTo = false;
      this.router.navigateByUrl('/dashboard');
    }
  }

  addModelerListener() {
    // 监听 modeler
    const bpmnjs = this.modeler
    const that = this
    // 'shape.removed', 'connect.end', 'connect.move'
    const events = ['shape.added', 'element.updateLabel']
    events.forEach(function(event) {
      that.modeler.on(event, e => {
        var elementRegistry = bpmnjs.get('elementRegistry')
        var shape = e.element ? elementRegistry.get(e.element.id) : e.shape
        // console.log(shape)
        if (event === 'shape.added') {
          console.log('新增了shape')
        } else if (event === 'shape.move.end') {
          console.log('移动了shape')
        } else if (event === 'shape.removed') {
          console.log('删除了shape')
        } else if (event === 'element.updateLabel') {
          console.log('element.updateLabel', e.element)
        }
      })
    })
  }

  addEventBusListener() {
    // 监听 element
    let that = this
    const eventBus = this.modeler.get('eventBus')
    const modeling = this.modeler.get('modeling')
    const elementRegistry = this.modeler.get('elementRegistry')
    // console.log(Object.keys(eventBus._listeners))
    // const eventTypes = ['element.click', 'element.changed']
    // const eventTypes = Object.keys(eventBus._listeners)
    const eventTypes = ['directEditing.activate', 'directEditing.complete']
    // const eventTypes = ['interactionEvents.updateHit', 'directEditing.complete']
    console.log(elementRegistry.getAll('bpmn:StartEvent'))
    eventTypes.forEach(function(eventType) {
      eventBus.on(eventType, function(e) {
        console.log(eventType)
        if (!e || !e.element) {
          console.log('无效的e', e)
          return
        }
        if (!e || e.element.type == 'bpmn:Process') return
        if (eventType === 'element.changed') {
          // that.elementChanged(e)
        } else if (eventType === 'element.click') {
          console.log('点击了element', e)
          var shape = e.element ? elementRegistry.get(e.element.id) : e.shape
          if (shape.type === 'bpmn:StartEvent') {
            modeling.updateProperties(shape, {
              name: '我是修改后的虚线节点',
              isInterrupting: false,
              customText: '我是自定义的text属性'
            })
          }
        } else if (eventType === 'interactionEvents.updateHit') {
          console.log('interactionEvents.updateHit', e.element)
        } else if (eventType === 'directEditing.complete') {
          console.log('directEditing.complete', e.element)
        }
      })
    })
  }

}
