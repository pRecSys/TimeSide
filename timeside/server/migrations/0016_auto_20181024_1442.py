# -*- coding: utf-8 -*-
# Generated by Django 1.9.13 on 2018-10-24 12:42
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('timeside_server', '0015_auto_20161214_1621'),
    ]

    operations = [
        migrations.AddField(
            model_name='item',
            name='code',
            field=models.CharField(blank=True, max_length=256, verbose_name='code'),
        ),
        migrations.AddField(
            model_name='item',
            name='external_id',
            field=models.CharField(blank=True, max_length=256, verbose_name='external_id'),
        ),
    ]
