# -*- coding: utf-8 -*-
# Generated by Django 1.10.8 on 2019-02-18 10:30
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('timeside_server', '0019_auto_20190211_1805'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='item',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='task', to='timeside_server.Item', verbose_name='item'),
        ),
    ]
